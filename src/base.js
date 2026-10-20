import { primitives, m4 } from '../vendor/twgl-full.module.js';

// Y é vertical; o cenário futuro ocupará o disco no plano XZ.
export const RAIO_BASE = 16;
export const ALTURA_SUPERFICIE = 0.22;

export function criarBase(gl) {
  const hemisphere = primitives.createSphereBufferInfo(
    gl, RAIO_BASE, 64, 24, Math.PI / 2, Math.PI,
  );
  const rim = primitives.createCylinderBufferInfo(gl, RAIO_BASE, 0.4, 64, 1);
  const surface = primitives.createDiscBufferInfo(gl, RAIO_BASE - 0.18, 64);

  function part(buffer, color, position, scale = [1, 1, 1]) {
    return { buffer, color, world: m4.scale(m4.translation(position), scale) };
  }

  return [
    part(hemisphere, [0.92, 0.94, 0.96], [0, 0, 0]),
    part(rim, [0.10, 0.12, 0.15], [0, 0, 0]),
    part(surface, [0.82, 0.76, 0.60], [0, ALTURA_SUPERFICIE, 0]),
  ];
}
