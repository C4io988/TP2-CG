import { primitives, m4, createBufferInfoFromArrays } from '../vendor/twgl-full.module.js';
import { criarGeometriaPraia } from './praia.js';
import { criarTexturasPraia } from './texturas.js';
import { MATERIAIS } from './materiais.js';

// Y é vertical; o cenário ocupa um quadrado de 32 × 32 no plano XZ.
export const MEIA_BASE = 16;
export const ALTURA_SUPERFICIE = 0.22;
export const ALTURA_BASE = 5;

export function criarBase(gl) {
  const bloco = primitives.createCubeBufferInfo(gl, 1);
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
    // A camada superior agora é oca, deixando espaço para o fundo do mar.
    part(bloco, [0.92, 0.94, 0.96], [0, -1.89, 0], [MEIA_BASE * 2, 0.2, MEIA_BASE * 2]),
    part(bloco, [0.92, 0.94, 0.96], [0, -2.7, 0], [MEIA_BASE * 2 - 3, 1.8, MEIA_BASE * 2 - 3]),
    part(bloco, [0.92, 0.94, 0.96], [0, -(ALTURA_BASE - 0.7), 0], [MEIA_BASE * 2 - 7, 1.4, MEIA_BASE * 2 - 7]),
    { ...part(areia, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.areia, material: MATERIAIS.areia },
    { ...part(lateral, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.areia, material: MATERIAIS.areia },
    { ...part(fundo, [0.76, 0.85, 0.78], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.areia, material: MATERIAIS.areia },
  ];
  const espessura = 0.18, centro = MEIA_BASE - espessura / 2;
  const dentro = MEIA_BASE * 2 - espessura * 2;
  for (const lado of [-1, 1]) {
    for (const eixo of ['x', 'z']) {
      const posicao = eixo === 'x' ? [lado * centro, -1, 0] : [0, -1, lado * centro];
      const tamanho = eixo === 'x' ? [espessura, 1.6, MEIA_BASE * 2] : [dentro, 1.6, espessura];
      partes.push(part(bloco, [0.92, 0.94, 0.96], posicao, tamanho));
      const borda = eixo === 'x' ? [lado * centro, 0.03, 0] : [0, 0.03, lado * centro];
      partes.push({ ...part(bloco, [0.10, 0.12, 0.15], borda, [tamanho[0], 0.46, tamanho[2]]),
        material: MATERIAIS.borda });
    }
  }
  const superficieAgua = { ...part(agua, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]),
    texture: texturas.agua, material: MATERIAIS.agua };
  return { partes, agua: superficieAgua, alturaTerreno: praia.alturaTerreno };
}
