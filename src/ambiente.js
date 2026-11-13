export const COR_CEU = [0.55, 0.72, 0.84];
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
  let noturno = false;
  let noite = 0;
  const misturar = (dia, escuro) => dia.map((v, i) => v + (escuro[i] - v) * noite);
  return {
    get noturno() { return noturno; },
    get noite() { return noite; },
    alternarDiaNoite() { noturno = !noturno; },
    atualizar(delta) {
      const alvo = noturno ? 1 : 0;
      noite += Math.sign(alvo - noite) * Math.min(Math.abs(alvo - noite), delta / 1.5);
    },
    get neblinaAtiva() { return neblinaAtiva; },
    alternarNeblina() { neblinaAtiva = !neblinaAtiva; },
    uniforms(eye, tempo) {
      const vento = ventoNoTempo(tempo);
      const distancia = Math.hypot(...eye);
      return {
        u_lightDirection: [-0.5, 1, 0.8],
        u_lightColor: misturar([1, 0.97, 0.90], [0.38, 0.48, 0.72]),
        u_ambientColor: misturar([0.90, 0.95, 1], [0.30, 0.37, 0.54]),
        u_ventoTempo: tempo,
        u_ventoForca: vento.forca,
        u_ventoDeslocamento: vento.deslocamento,
        u_ventoDirecao: vento.direcao,
        u_neblinaAtiva: neblinaAtiva,
        u_neblinaCor: misturar([0.894, 0.929, 0.945], [0.045, 0.065, 0.13]),
        // A faixa acompanha o zoom para a ilha continuar legível de longe.
        u_neblinaInicio: Math.max(8, distancia - 12),
        u_neblinaFim: Math.max(8, distancia - 12) + 25,
      };
    },
  };
}
