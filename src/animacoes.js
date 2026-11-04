const RAD = Math.PI / 180;
const sin = graus => Math.sin(graus * RAD);
const cos = graus => Math.cos(graus * RAD);

// Adaptação manual do ground_idle do Cobblemon. As expressões originais
// usam graus e q.anim_time; aqui o tempo vem do loop WebGL em segundos.
export function idleSlowpoke(tempo) {
  const fase = tempo * 135;
  return {
    torso: {
      rotation: [-sin(fase) * 0.5, -cos(fase / 2), 0],
      position: [0, cos(fase) * 0.2, 0],
    },
    head: { rotation: [-sin(fase - 30) * 2, -cos(fase / 2 - 60), 0] },
    ear_left: { rotation: [-sin(fase - 60) * 4, 0, 0] },
    jaw: { rotation: [25 - sin(fase - 60) * 2, 0, 0] },
    // Neste sistema de eixos, X negativo curva a cauda para cima.
    tail: { rotation: [-20 + sin(fase - 30) * 3, -cos(fase / 2 - 30) * 2, 0] },
    tail2: { rotation: [-45 + sin(fase - 90) * 3, -cos(fase / 2 - 90) * 2, 0] },
    tail3: { rotation: [-40 + sin(fase - 120) * 5, -cos(fase / 2 - 120) * 5, 0] },
    tail4: { rotation: [-10 + sin(fase - 160) * 2, -cos(fase / 2 - 160) * 6, 0] },
  };
}

// Adaptação do ground_walk: patas diagonais alternadas e cauda preservada acima do chão.
export function caminhadaSlowpoke(tempo) {
  const fase = tempo * 360;
  const animacao = idleSlowpoke(tempo);
  animacao.torso = { rotation: [-sin(fase * 2), -cos(fase) * 2, cos(fase) * 2],
    position: [0, cos(fase * 2) * 0.2, 0] };
  animacao.tail.rotation = [-20 + sin(fase * 2 - 60) * 2, -cos(fase - 60) * 5, 0];
  animacao.tail2.rotation = [-35 + sin(fase * 2 - 120), -cos(fase - 120) * 6, 0];
  animacao.tail3.rotation = [-22.5 + sin(fase * 2 - 180) * 4, -cos(fase - 160) * 6, 0];
  animacao.tail4.rotation = [-10 + sin(fase * 2 - 210) * 5, -cos(fase - 210) * 6, 0];
  for (const [nome, deslocamento] of [['leg_front_left', 180], ['leg_back_right', 180],
    ['leg_front_right', 0], ['leg_back_left', 0]]) {
    const ciclo = fase + deslocamento;
    animacao[nome] = {
      rotation: [-sin(ciclo) * 10, 0, 0],
      position: [0, Math.max(0, cos(ciclo)) * 0.8 + Math.abs(sin(ciclo)) * 0.3, -sin(ciclo) * 0.6],
    };
  }
  return animacao;
}

export function misturarAnimacoes(inicio, fim, peso) {
  const resultado = {};
  for (const nome of new Set([...Object.keys(inicio), ...Object.keys(fim)])) {
    resultado[nome] = {};
    for (const canal of ['rotation', 'position']) {
      const a = inicio[nome]?.[canal] || [0, 0, 0];
      const b = fim[nome]?.[canal] || [0, 0, 0];
      resultado[nome][canal] = a.map((valor, eixo) => valor + (b[eixo] - valor) * peso);
    }
  }
  return resultado;
}
