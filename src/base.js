import { primitives, m4, createBufferInfoFromArrays } from '../vendor/twgl-full.module.js';
import { criarGeometriaPraia } from './praia.js?v=casco';
import { criarTexturasPraia } from './texturas.js';
import { MATERIAIS } from './materiais.js';

// Y é vertical; MEIA_BASE é o raio do diorama circular no plano XZ.
export const MEIA_BASE = 16;
export const ALTURA_SUPERFICIE = 0.22;
export const ALTURA_BASE = MEIA_BASE;

export function criarBase(gl) {
  const casco = primitives.createSphereBufferInfo(gl, MEIA_BASE, 128, 48, Math.PI / 2, Math.PI);
  const aro = primitives.createTorusBufferInfo(gl, MEIA_BASE - 0.03, 0.24, 128, 16);
  const botao = primitives.createSphereBufferInfo(gl, 1, 32, 16);
  const praia = criarGeometriaPraia(MEIA_BASE - 0.18);
  const texturas = criarTexturasPraia(gl);
  const areia = createBufferInfoFromArrays(gl, praia.areia);
  const agua = createBufferInfoFromArrays(gl, praia.agua);
  const lateral = createBufferInfoFromArrays(gl, praia.lateral);
  const fundo = createBufferInfoFromArrays(gl, praia.fundo);

  function part(buffer, color, position, scale = [1, 1, 1]) {
    return { buffer, color, material: MATERIAIS.base, world: m4.scale(m4.translation(position), scale) };
  }

  const partes = [
    part(casco, [0.92, 0.94, 0.96], [0, -0.20, 0]),
    { ...part(aro, [0.055, 0.065, 0.08], [0, 0.03, 0]), material: MATERIAIS.borda },
    { ...part(areia, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.areia, material: MATERIAIS.areia },
    { ...part(lateral, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.areia, material: MATERIAIS.areia },
    { ...part(fundo, [0.76, 0.85, 0.78], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.areia, material: MATERIAIS.areia },
  ];
  // A tampa fica recolhida enquanto o diorama está aberto.
  const tampa = [part(primitives.createSphereBufferInfo(gl, MEIA_BASE, 128, 48,
    0, Math.PI / 2), [0.035, 0.25, 0.57], [0, -0.20, 0])];
  for (const lado of [-1, 1]) {
    const faixa = part(createBufferInfoFromArrays(gl, criarFaixaGreatBall(lado)),
      [0.80, 0.035, 0.025], [0, -0.20, 0]);
    faixa.world = m4.rotateY(faixa.world, 0.35);
    faixa.material = { u_material: [0.38, 0.68, 0.38], u_shininess: 80 };
    tampa.push(faixa);
  }
  const dobradica = part(primitives.createCubeBufferInfo(gl, 1), [0.52, 0.57, 0.61],
    [0, -0.20, -MEIA_BASE], [2.5, 1.0, 0.24]);
  dobradica.world = m4.multiply(m4.rotationY(0.35), dobradica.world);
  tampa.push(dobradica);
  // Cinta preta larga no equador, acompanhando a esfera sem engrossar o aro aberto.
  tampa.push({ ...part(primitives.createSphereBufferInfo(gl, MEIA_BASE + 0.045,
    128, 8, Math.PI / 2 - 0.05, Math.PI / 2 + 0.05),
    [0.018, 0.022, 0.03], [0, -0.20, 0]), material: MATERIAIS.borda });
  const interior = new Set(partes.slice(2));
  // Fecho frontal em relevo, alinhado com a câmera inicial.
  const frente = m4.rotationY(0.35);
  const camadasFecho = [
    [4.25, 0.42, [0.018, 0.022, 0.03]],
    [3.48, 0.56, [0.92, 0.97, 1]],
    [2.65, 0.64, [0.34, 0.40, 0.44]],
    [2.49, 0.72, [0.97, 0.99, 1]],
  ];
  for (const fechado of [false, true]) {
    const fator = fechado ? 1 : 1.65 / 4.25;
    for (const [raio, profundidade, cor] of camadasFecho) {
      const fecho = part(botao, cor, [0, -0.28, MEIA_BASE],
        [raio * fator, raio * fator, profundidade * (fechado ? 1 : 0.75)]);
      fecho.world = m4.multiply(frente, fecho.world);
      if (fechado) tampa.push(fecho);
      else { partes.push(fecho); interior.add(fecho); }
    }
  }
  const superficieAgua = { ...part(agua, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]),
    texture: texturas.agua, material: MATERIAIS.agua };
  return { partes, tampa, interior, agua: superficieAgua, alturaTerreno: praia.alturaTerreno,
    profundidadeAgua: praia.profundidadeAgua };
}

// Duas faixas contínuas contornam a tampa da frente até atrás. O parâmetro
// transversal controla a largura; o longitudinal acompanha o arco da esfera.
export function criarFaixaGreatBall(lado) {
  const dados = { position: [], normal: [], texcoord: [], indices: [] };
  const colunas = 20, linhas = 96;
  function ponto(u, v, base = false) {
    const beta = lado * (0.62 + 0.24 * (1 - v * v) + u * 0.18);
    const limite = 1.04 - 0.12 + 0.12 * Math.sqrt(Math.max(0, 1 - u * u));
    const t = v * limite;
    const borda = Math.min((1 - Math.abs(u)) * 0.18, (1 - Math.abs(v)) * limite);
    const arredondado = Math.sin(Math.min(1, borda / 0.035) * Math.PI / 2);
    const raio = base ? MEIA_BASE + 0.015 : MEIA_BASE + 0.06 + 0.22 * arredondado;
    return [raio * Math.sin(beta), raio * Math.cos(beta) * Math.cos(t),
      raio * Math.cos(beta) * Math.sin(t)];
  }
  function vertice(p, normal, u, v) {
    const indice = dados.position.length / 3;
    dados.position.push(...p); dados.normal.push(...normal); dados.texcoord.push(u, v);
    return indice;
  }
  function triangulo(a, b, c) {
    const p = i => dados.position.slice(i * 3, i * 3 + 3);
    const pa = p(a), pb = p(b), pc = p(c);
    const ab = pb.map((x,i) => x-pa[i]), ac = pc.map((x,i) => x-pa[i]);
    const n = [ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0]];
    if (n.reduce((s,x,i) => s+x*pa[i],0) < 0) dados.indices.push(a,c,b);
    else dados.indices.push(a,b,c);
  }
  for (let j=0;j<=linhas;j++) for(let i=0;i<=colunas;i++) {
    const u=i/colunas*2-1, v=j/linhas*2-1;
    const p=ponto(u,v), r=Math.hypot(...p);
    vertice(p,p.map(x=>x/r),i/colunas,j/linhas);
  }
  for(let j=0;j<linhas;j++) for(let i=0;i<colunas;i++) {
    const a=j*(colunas+1)+i,b=a+1,c=a+colunas+1,d=c+1;
    triangulo(a,b,c);triangulo(b,d,c);
  }
  // Saia curta fecha o relevo das peças vermelhas contra a tampa azul.
  const contorno=[];
  for(let i=0;i<=colunas;i++)contorno.push([i,0]);
  for(let j=1;j<=linhas;j++)contorno.push([colunas,j]);
  for(let i=colunas-1;i>=0;i--)contorno.push([i,linhas]);
  for(let j=linhas-1;j>0;j--)contorno.push([0,j]);
  for(let k=0;k<contorno.length;k++) {
    const [i,j]=contorno[k], [ii,jj]=contorno[(k+1)%contorno.length];
    const a=j*(colunas+1)+i,b=jj*(colunas+1)+ii;
    const p=ponto(i/colunas*2-1,j/linhas*2-1,true),q=ponto(ii/colunas*2-1,jj/linhas*2-1,true);
    const c=vertice(p,p.map(x=>x/Math.hypot(...p)),0,0),d=vertice(q,q.map(x=>x/Math.hypot(...q)),1,0);
    triangulo(a,c,b);triangulo(b,c,d);
  }
  return dados;
}
