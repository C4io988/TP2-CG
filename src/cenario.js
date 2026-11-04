import { m4, primitives } from '../vendor/twgl-full.module.js';
import { ALTURA_SUPERFICIE } from './base.js';
import { posicaoNaPraia } from './praia.js';
import { criarTexturasCenario } from './texturas.js';
import { MATERIAIS } from './materiais.js';

export function criarCenario(gl, alturaTerreno) {
  const cubo = primitives.createCubeBufferInfo(gl, 1);
  const texturas = criarTexturasCenario(gl);
  const partes = [], objetos = [], raizes = [], helices = [];

  function no(pai, local = m4.identity()) {
    const filho = { local, world: m4.identity(), filhos: [], parte: null };
    if (pai) pai.filhos.push(filho);
    else raizes.push(filho);
    return filho;
  }

  function peca(pai, posicao, tamanho, textura, material, cor = [1, 1, 1], giro = [0, 0, 0]) {
    let local = m4.translation(posicao);
    local = m4.rotateY(local, giro[1]);
    local = m4.rotateZ(local, giro[2]);
    local = m4.rotateX(local, giro[0]);
    const filho = no(pai, m4.scale(local, tamanho));
    filho.parte = { buffer: cubo, world: filho.world, color: cor,
      texture: texturas[textura] || null, material: MATERIAIS[material] };
    partes.push(filho.parte);
    return filho;
  }

  function registrar(tipo, distancia, lateral, raio, escala = 1, orientacao = 0) {
    const [x, z] = posicaoNaPraia(distancia, lateral);
    const altura = alturaTerreno(x, z);
    if (altura <= 0) throw new Error(`Objeto ${tipo} fora da areia.`);
    const posicao = [x, ALTURA_SUPERFICIE + altura, z];
    const raiz = no(null, m4.scale(m4.rotateY(m4.translation(posicao), orientacao), [escala, escala, escala]));
    // Área aproximada para a navegação futura; a copa não bloqueia o chão.
    objetos.push({ tipo, posicao, orientacao, escala, raio: raio * escala, raiz });
    return raiz;
  }

  function coqueiro(distancia, lado, escala, giro) {
    const raiz = registrar('coqueiro', distancia, lado, 0.55, escala, giro);
    // Segmentos levemente deslocados dão uma inclinação sem perder o estilo em blocos.
    for (let i = 0; i < 6; i++) {
      peca(raiz, [0.05 * i * i, 0.47 + i * 0.88, 0.035 * i],
        [0.68 - i * 0.045, 0.97, 0.68 - i * 0.045], 'madeira', 'madeira', [1, 0.93, 0.85]);
    }
    const copa = no(raiz, m4.translation([1.4, 5.4, 0.18]));
    for (let folha = 0; folha < 7; folha++) {
      const ramo = no(copa, m4.rotationY(folha * Math.PI * 2 / 7 + 0.08 * Math.sin(folha * 3)));
      const comprimento = 0.88 + 0.12 * Math.sin(folha * 2.7);
      for (let segmento = 0; segmento < 4; segmento++) {
        const queda = [0.10, 0.24, -0.03, -0.55][segmento];
        peca(ramo, [0.38 + segmento * comprimento * 0.86, queda, 0],
          [comprimento, 0.18, 0.65 - segmento * 0.12], 'folhas', 'folhas',
          [0.91 + folha * 0.012, 1, 0.88], [0, 0, segmento < 2 ? 0.12 : -0.38]);
      }
    }
    for (const [x, y, z] of [[0.95, 4.9, 0.48], [1.65, 4.85, -0.16]]) {
      peca(raiz, [x, y, z], [0.42, 0.48, 0.43], 'madeira', 'madeira', [0.72, 0.70, 0.64]);
    }
  }

  function samambaia(distancia, lado, escala, giro) {
    const raiz = registrar('samambaia', distancia, lado, 0.65, escala, giro);
    peca(raiz, [0, 0.19, 0], [0.12, 0.38, 0.12], 'folhas', 'folhas');
    for (let i = 0; i < 5; i++) {
      const ramo = no(raiz, m4.rotationY(i * Math.PI * 2 / 5));
      peca(ramo, [0.30, 0.40, 0], [0.85, 0.14, 0.33], 'folhas', 'folhas', [0.85, 1, 0.83], [0, 0, 0.48]);
      peca(ramo, [0.88, 0.43, 0], [0.58, 0.12, 0.24], 'folhas', 'folhas', [0.94, 1, 0.88], [0, 0, -0.25]);
    }
  }

  function pedra(distancia, lado, escala, giro) {
    const raiz = registrar('pedra', distancia, lado, 0.72, escala, giro);
    peca(raiz, [0, 0.23, 0], [1.25, 0.58, 0.88], 'pedra', 'pedra', [1, 0.98, 0.95]);
    peca(raiz, [-0.15, 0.54, 0.03], [0.80, 0.34, 0.68], 'pedra', 'pedra', [0.94, 0.96, 0.94]);
    peca(raiz, [0.48, 0.12, 0.15], [0.46, 0.28, 0.57], 'pedra', 'pedra');
  }

  function coco(distancia, lado, giro) {
    const raiz = registrar('coco', distancia, lado, 0.25, 1, giro);
    peca(raiz, [0, 0.20, 0], [0.43, 0.40, 0.46], 'madeira', 'madeira', [0.75, 0.73, 0.66], [0, 0, 0.12]);
    peca(raiz, [0.02, 0.405, 0.03], [0.08, 0.02, 0.07], null, 'madeira', [0.16, 0.13, 0.09]);
  }

  function concha(distancia, lado, escala, giro) {
    const raiz = registrar('concha', distancia, lado, 0.30, escala, giro);
    for (let i = -2; i <= 2; i++) {
      const comprimento = 0.45 - Math.abs(i) * 0.075;
      peca(raiz, [i * 0.095, 0.06 + (2 - Math.abs(i)) * 0.025, 0],
        [0.105, 0.12, comprimento], 'tecido', 'pedra',
        i % 2 ? [1, 0.85, 0.76] : [1, 0.96, 0.91], [0, i * 0.12, 0]);
    }
  }

  function guardaSol(distancia, lado) {
    const raiz = registrar('guarda-sol', distancia, lado, 1.9, 1, -0.18);
    peca(raiz, [0, 1.7, 0], [0.14, 3.4, 0.14], 'madeira', 'madeira', [1, 1, 0.95]);
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        if (Math.abs(x) === 2 && Math.abs(z) === 2) continue;
        const altura = 3.1 + (2 - Math.max(Math.abs(x), Math.abs(z))) * 0.20;
        const cor = (x < 0) === (z < 0) ? [0.90, 0.45, 0.34] : [1, 1, 1];
        peca(raiz, [x * 0.66, altura, z * 0.66], [0.67, 0.17, 0.67], 'tecido', 'tecido', cor);
      }
    }
  }

  function catavento(distancia, lado) {
    const raiz = registrar('catavento', distancia, lado, 0.45, 1, 0.35);
    peca(raiz, [0, 1.9, 0], [0.28, 3.8, 0.28], 'madeira', 'madeira');
    const helice = no(raiz, m4.translation([0, 3.65, 0.32]));
    const cores = [[0.43, 0.73, 0.69], [1, 0.96, 0.83], [0.89, 0.52, 0.34], [0.91, 0.79, 0.49]];
    for (let i = 0; i < 4; i++) {
      const pa = no(helice, m4.rotationZ(i * Math.PI / 2));
      peca(pa, [0.17, 0.87, 0], [0.42, 1.45, 0.10], 'tecido', 'tecido', cores[i]);
    }
    peca(helice, [0, 0, 0.05], [0.42, 0.42, 0.25], 'madeira', 'madeira');
    helices.push({ raiz, helice });
  }

  function fogueira(distancia, lado) {
    const raiz = registrar('fogueira', distancia, lado, 1.15);
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5;
      peca(raiz, [Math.cos(a), 0.15, Math.sin(a)], [0.42, 0.30, 0.40], 'pedra', 'pedra',
        [0.88 + (i % 3) * 0.04, 0.90, 0.87], [0, a, 0]);
    }
    peca(raiz, [0, 0.08, 0], [1.2, 0.16, 1.2], 'pedra', 'pedra', [0.30, 0.31, 0.29]);
    for (let i = 0; i < 3; i++) {
      peca(raiz, [0, 0.24 + i * 0.10, 0], [1.40, 0.24, 0.28], 'madeira', 'madeira',
        [0.78, 0.75, 0.70], [0, 0.35 + i * 1.1, 0]);
    }
  }

  // Pequenos grupos nas laterais e ao fundo; o corredor central fica livre.
  coqueiro(-10, -5, 1.05, 0.25);
  coqueiro(-7.8, -8, 0.82, -0.65);
  coqueiro(-9, 5, 0.96, 2.5);
  coqueiro(-7, 7, 0.77, 1.8);
  for (const [d, l, s, g] of [[-11.5, -5.5, 0.72, 0.3], [-10, -3.4, 0.90, 1.2],
    [-8, -8.8, 0.68, 2.1], [-10.8, 5.8, 0.80, 0.6], [-7.3, 5.8, 0.62, 2.7],
    [-6.4, 6.6, 0.72, 1.6], [-12, -0.5, 0.67, 0.2]]) samambaia(d, l, s, g);
  guardaSol(-2.5, -6);
  catavento(-7, -5);
  fogueira(-3, 5);
  for (const [d, l, s, g] of [[3, 7, 1, 0.4], [3.9, 7.7, 0.44, 1.7], [2.2, 7.9, 0.58, 2.6],
    [5, -7, 0.85, -0.4], [5.8, -6.4, 0.40, 0.7], [-9, 9, 0.70, 1.1], [-12, 0, 0.65, 2.3]]) pedra(d, l, s, g);
  coco(-9.3, -4.0, 0.4);
  coco(-10.2, -3.9, -0.6);
  coco(-8.3, 4.2, 1.5);
  for (const [d, l, s, g] of [[8, -4, 1, 0.4], [8.7, -4.3, 0.65, -0.7], [8, 4.5, 0.82, 2.2],
    [10, -2.8, 0.72, 1.4], [11, 3.4, 0.9, -0.3], [7, 6, 0.65, 0.8]]) concha(d, l, s, g);

  function atualizarNo(raiz, mundoPai = m4.identity()) {
    raiz.world = m4.multiply(mundoPai, raiz.local);
    if (raiz.parte) raiz.parte.world = raiz.world;
    for (const filho of raiz.filhos) atualizarNo(filho, raiz.world);
  }
  for (const raiz of raizes) atualizarNo(raiz);

  return {
    partes, objetos,
    atualizar(tempo) {
      for (const { raiz, helice } of helices) {
        helice.local = m4.rotateZ(m4.translation([0, 3.65, 0.32]), tempo * 0.9);
        atualizarNo(helice, raiz.world);
      }
    },
  };
}
