export const COR_CEU = [0.894, 0.929, 0.945];
export const DIRECAO_VENTO = [0.8, 0.6];

export function ventoNoTempo(tempo) {
  return {
    direcao: DIRECAO_VENTO,
    forca: 0.65 + Math.sin(tempo * 0.22) * 0.20 + Math.sin(tempo * 0.63) * 0.12,
    // Integral da força: mantém a fase contínua quando uma rajada muda de intensidade.
    deslocamento: tempo * 0.65 + (1 - Math.cos(tempo * 0.22)) * 0.20 / 0.22
      + (1 - Math.cos(tempo * 0.63)) * 0.12 / 0.63,
  };
}

export function criarAmbiente() {
  let neblinaAtiva = true;
  return {
    get neblinaAtiva() { return neblinaAtiva; },
    alternarNeblina() { neblinaAtiva = !neblinaAtiva; },
    uniforms(eye, tempo) {
      const vento = ventoNoTempo(tempo);
      const distancia = Math.hypot(...eye);
      return {
        u_ventoTempo: tempo,
        u_ventoForca: vento.forca,
        u_ventoDeslocamento: vento.deslocamento,
        u_ventoDirecao: vento.direcao,
        u_neblinaAtiva: neblinaAtiva,
        u_neblinaCor: COR_CEU,
        // A faixa acompanha o zoom para a ilha continuar legível de longe.
        u_neblinaInicio: Math.max(8, distancia - 12),
        u_neblinaFim: Math.max(8, distancia - 12) + 25,
      };
    },
  };
}
