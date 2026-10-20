import { primitives, m4, createBufferInfoFromArrays } from '../vendor/twgl-full.module.js';
import { criarGeometriaPraia } from './praia.js';
import { criarTexturasPraia } from './texturas.js';

// Y é vertical; o cenário futuro ocupará o disco no plano XZ.
export const RAIO_BASE = 16;
export const ALTURA_SUPERFICIE = 0.22;

export function criarBase(gl) {
  const hemisphere = primitives.createSphereBufferInfo(
    gl, RAIO_BASE, 64, 24, Math.PI / 2, Math.PI,
  );
  const rim = primitives.createCylinderBufferInfo(gl, RAIO_BASE, 0.4, 64, 1);
  const praia = criarGeometriaPraia(RAIO_BASE - 0.18);
  const texturas = criarTexturasPraia(gl);
  const areia = createBufferInfoFromArrays(gl, praia.areia);
  const agua = createBufferInfoFromArrays(gl, praia.agua);
  const lateral = createBufferInfoFromArrays(gl, praia.lateral);

  function part(buffer, color, position, scale = [1, 1, 1]) {
    return { buffer, color, world: m4.scale(m4.translation(position), scale) };
  }

  const partes = [
    part(hemisphere, [0.92, 0.94, 0.96], [0, 0, 0]),
    part(rim, [0.10, 0.12, 0.15], [0, 0, 0]),
    { ...part(areia, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.areia },
    { ...part(agua, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.agua },
    { ...part(lateral, [1, 1, 1], [0, ALTURA_SUPERFICIE, 0]), texture: texturas.areia },
  ];
  return { partes, alturaTerreno: praia.alturaTerreno };
}
