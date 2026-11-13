import { primitives, m4, createBufferInfoFromArrays } from '../vendor/twgl-full.module.js';
import { criarGeometriaPraia } from './praia.js';
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
  // Fecho frontal em relevo, alinhado com a câmera inicial.
  const frente = m4.rotationY(0.35);
  for (const [raio, profundidade, cor] of [
    [1.65, 0.40, [0.055, 0.065, 0.08]],
    [1.22, 0.48, [0.97, 0.98, 1]],
    [0.83, 0.53, [0.82, 0.87, 0.91]],
  ]) {
    const fecho = part(botao, cor, [0, -0.28, MEIA_BASE], [raio, raio, profundidade]);
    fecho.world = m4.multiply(frente, fecho.world);
    partes.push(fecho);
  }
  const superficieAgua = { ...part(agua, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]),
    texture: texturas.agua, material: MATERIAIS.agua };
  return { partes, agua: superficieAgua, alturaTerreno: praia.alturaTerreno,
    profundidadeAgua: praia.profundidadeAgua };
}
