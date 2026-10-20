import { primitives, m4, createBufferInfoFromArrays } from '../vendor/twgl-full.module.js';
import { criarGeometriaPraia } from './praia.js';
import { criarTexturasPraia } from './texturas.js';

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

  function part(buffer, color, position, scale = [1, 1, 1]) {
    return { buffer, color, world: m4.scale(m4.translation(position), scale) };
  }

  const partes = [
    // Camadas rasas e cada vez menores dão um contorno de tigela em blocos.
    // O topo branco termina em Y = -0.2, onde começa a faixa preta.
    // Assim as faces laterais das duas cores não disputam a mesma profundidade.
    part(bloco, [0.92, 0.94, 0.96], [0, -1, 0], [MEIA_BASE * 2, 1.6, MEIA_BASE * 2]),
    part(bloco, [0.92, 0.94, 0.96], [0, -2.7, 0], [MEIA_BASE * 2 - 3, 1.8, MEIA_BASE * 2 - 3]),
    part(bloco, [0.92, 0.94, 0.96], [0, -(ALTURA_BASE - 0.7), 0], [MEIA_BASE * 2 - 7, 1.4, MEIA_BASE * 2 - 7]),
    part(bloco, [0.10, 0.12, 0.15], [0, 0, 0], [MEIA_BASE * 2, 0.4, MEIA_BASE * 2]),
    { ...part(areia, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.areia },
    { ...part(agua, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.agua },
    { ...part(lateral, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.areia },
  ];
  return { partes, alturaTerreno: praia.alturaTerreno };
}
