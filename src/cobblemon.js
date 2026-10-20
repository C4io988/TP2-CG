import * as twgl from '../vendor/twgl-full.module.js';

const { m4 } = twgl;
const RAD = Math.PI / 180;

// A textura Bedrock usa pixels medidos a partir do canto superior esquerdo.
function caixaUV(cubo, face, larguraTextura, alturaTextura) {
  const [u, v] = cubo.uv;
  const [w, h, d] = cubo.size;
  const areas = {
    north: [u + d, v + d, w, h],
    east: [u + d + w, v + d, d, h],
    south: [u + 2 * d + w, v + d, w, h],
    west: [u, v + d, d, h],
    up: [u + d, v, w, d],
    down: [u + d + w, v, w, d],
  };
  const [px, py, pw, ph] = areas[face];
  return [px / larguraTextura, py / alturaTextura, (px + pw) / larguraTextura, (py + ph) / alturaTextura];
}

function matrizRotacao(pivo, graus) {
  let matriz = m4.translation(pivo);
  matriz = m4.rotateZ(matriz, (graus[2] || 0) * RAD);
  matriz = m4.rotateY(matriz, (graus[1] || 0) * RAD);
  matriz = m4.rotateX(matriz, (graus[0] || 0) * RAD);
  return m4.translate(matriz, pivo.map(valor => -valor));
}

function adicionarCubo(dados, cubo, pivoOsso, larguraTextura, alturaTextura) {
  const inflar = cubo.inflate || 0;
  const [ox, oy, oz] = cubo.origin;
  const [w, h, d] = cubo.size;
  const x0 = ox - inflar, x1 = ox + w + inflar;
  const y0 = oy - inflar, y1 = oy + h + inflar;
  const z0 = oz - inflar, z1 = oz + d + inflar;
  const rotacao = cubo.rotation ? matrizRotacao(cubo.pivot || [0, 0, 0], cubo.rotation) : null;

  const faces = [
    ['north', [0, 0, -1], [[x0,y0,z0], [x0,y1,z0], [x1,y1,z0], [x1,y0,z0]]],
    ['south', [0, 0, 1], [[x1,y0,z1], [x1,y1,z1], [x0,y1,z1], [x0,y0,z1]]],
    ['east', [1, 0, 0], [[x1,y0,z0], [x1,y1,z0], [x1,y1,z1], [x1,y0,z1]]],
    ['west', [-1, 0, 0], [[x0,y0,z1], [x0,y1,z1], [x0,y1,z0], [x0,y0,z0]]],
    ['up', [0, 1, 0], [[x0,y1,z0], [x0,y1,z1], [x1,y1,z1], [x1,y1,z0]]],
    ['down', [0, -1, 0], [[x0,y0,z1], [x0,y0,z0], [x1,y0,z0], [x1,y0,z1]]],
  ];

  for (const [nome, normal, cantos] of faces) {
    if ((d === 0 && nome === 'south') || (w === 0 && nome === 'west') || (h === 0 && nome === 'down')) continue;
    if ((nome === 'north' || nome === 'south') && w * h === 0) continue;
    if ((nome === 'east' || nome === 'west') && d * h === 0) continue;
    if ((nome === 'up' || nome === 'down') && w * d === 0) continue;

    let [u0, v0, u1, v1] = caixaUV(cubo, nome, larguraTextura, alturaTextura);
    if (cubo.mirror) [u0, u1] = [u1, u0];
    const mapaUV = [[u0,v1], [u0,v0], [u1,v0], [u1,v1]];
    const normalFinal = rotacao ? m4.transformDirection(rotacao, normal) : normal;
    const inicio = dados.a_position.length / 3;

    for (let i = 0; i < 4; i++) {
      const posicao = rotacao ? m4.transformPoint(rotacao, cantos[i]) : cantos[i];
      dados.a_position.push(...posicao.map((valor, eixo) => valor - pivoOsso[eixo]));
      dados.a_normal.push(...normalFinal);
      dados.a_texcoord.push(...mapaUV[i]);
    }
    dados.indices.push(inicio, inicio + 1, inicio + 2, inicio, inicio + 2, inicio + 3);
  }
}

export function criarModelo(gl, geometria) {
  const fonte = geometria['minecraft:geometry']?.[0];
  if (!fonte) throw new Error('Arquivo Bedrock sem minecraft:geometry.');
  const largura = fonte.description.texture_width;
  const altura = fonte.description.texture_height;
  const ossos = new Map();

  for (const bone of fonte.bones) {
    const dados = { position: { numComponents: 3, data: [] }, normal: { numComponents: 3, data: [] }, texcoord: { numComponents: 2, data: [] }, indices: [] };
    const simples = { a_position: dados.position.data, a_normal: dados.normal.data, a_texcoord: dados.texcoord.data, indices: dados.indices };
    for (const cubo of bone.cubes || []) adicionarCubo(simples, cubo, bone.pivot || [0, 0, 0], largura, altura);
    if (ossos.has(bone.name)) throw new Error(`Osso duplicado: ${bone.name}`);
    ossos.set(bone.name, {
      nome: bone.name,
      parent: bone.parent || null,
      pivo: bone.pivot || [0, 0, 0],
      rotacao: bone.rotation || [0, 0, 0],
      buffer: dados.indices.length ? twgl.createBufferInfoFromArrays(gl, dados) : null,
    });
  }

  for (const osso of ossos.values()) {
    if (osso.parent && !ossos.has(osso.parent)) throw new Error(`Osso pai ausente: ${osso.parent}`);
  }
  return ossos;
}

export function calcularMatrizes(ossos, animacao, posicao = [0, 0, 0], escala = 0.1, anguloY = 0) {
  let mundoRaiz = m4.rotateY(m4.translation(posicao), anguloY);
  mundoRaiz = m4.scale(mundoRaiz, [escala, escala, escala]);
  const matrizes = new Map();
  const visitando = new Set();

  // Resolve o pai primeiro, mesmo que os ossos venham fora de ordem no JSON.
  function resolver(osso) {
    if (matrizes.has(osso.nome)) return matrizes.get(osso.nome);
    if (visitando.has(osso.nome)) throw new Error(`Ciclo na hierarquia: ${osso.nome}`);
    visitando.add(osso.nome);
    const pai = osso.parent ? ossos.get(osso.parent) : null;
    const pivoPai = pai?.pivo || [0, 0, 0];
    const deslocamento = osso.pivo.map((valor, eixo) => valor - pivoPai[eixo]);
    const movimento = animacao[osso.nome] || {};
    const posicao = movimento.position || [0, 0, 0];
    const giro = osso.rotacao.map((valor, eixo) => valor + (movimento.rotation?.[eixo] || 0));
    let local = m4.translation(deslocamento.map((valor, eixo) => valor + posicao[eixo]));
    local = m4.rotateZ(local, giro[2] * RAD);
    local = m4.rotateY(local, giro[1] * RAD);
    local = m4.rotateX(local, giro[0] * RAD);
    const mundo = m4.multiply(pai ? resolver(pai) : mundoRaiz, local);
    matrizes.set(osso.nome, mundo);
    visitando.delete(osso.nome);
    return mundo;
  }

  for (const osso of ossos.values()) resolver(osso);
  return matrizes;
}

export function desenharModelo(gl, programInfo, ossos, textura, animacao, viewProjection, posicao, escala, anguloY) {
  const matrizes = calcularMatrizes(ossos, animacao, posicao, escala, anguloY);
  for (const osso of ossos.values()) {
    if (!osso.buffer) continue;
    const mundo = matrizes.get(osso.nome);

    twgl.setBuffersAndAttributes(gl, programInfo, osso.buffer);
    twgl.setUniforms(programInfo, {
      u_worldViewProjection: m4.multiply(viewProjection, mundo),
      u_worldInverseTranspose: m4.transpose(m4.inverse(mundo)),
      u_texture: textura,
      u_useTexture: true,
      u_color: [1, 1, 1],
    });
    twgl.drawBufferInfo(gl, osso.buffer);
  }
}
