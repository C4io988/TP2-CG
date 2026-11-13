import { MEIA_BASE } from './base.js';
import { ventoNoTempo } from './ambiente.js';

export function alturaOnda(x, z, tempo, profundidade) {
  // Mesma função de deslocamento de agua.vert.glsl, para o Shellder flutuar junto.
  const vento = ventoNoTempo(tempo);
  const [dx, dz] = vento.direcao;
  const borda = MEIA_BASE - 0.18 - Math.hypot(x, z);
  const t = Math.max(0, Math.min(1, borda / 0.65));
  const fade = t * t * (3 - 2 * t) * Math.max(0, Math.min(1, profundidade / 0.9));
  const faseA = (x * dx + z * dz) * 0.85 - tempo * 1.6 - vento.deslocamento * 0.45;
  const faseB = (-x * dz + z * dx) * 1.15 + tempo * 1.1 + vento.deslocamento * 0.2;
  return fade * (Math.sin(faseA) * (0.095 + vento.forca * 0.035)
    + Math.cos(faseB) * (0.035 + vento.forca * 0.015));
}
