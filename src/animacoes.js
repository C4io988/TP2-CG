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
    // O eixo X da mandíbula é invertido em relação ao clipe Bedrock.
    jaw: { rotation: [-32.5 + sin(fase - 60) * 2, 0, 0] },
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
    for (const canal of ['rotation', 'position', 'scale']) {
      const padrao = canal === 'scale' ? [1, 1, 1] : [0, 0, 0];
      const a = inicio[nome]?.[canal] || padrao;
      const b = fim[nome]?.[canal] || padrao;
      resultado[nome][canal] = a.map((valor, eixo) => valor + (b[eixo] - valor) * peso);
    }
  }
  return resultado;
}

// water_idle e water_swim do Cobblemon, com o eixo X adaptado.
// A navegação controla posição e direção; os clipes movimentam corpo, língua e concha.
export function repousoShellder(tempo) {
  const fase = tempo * 180;
  const piscando = tempo % 6.2 > 5.95 && tempo % 6.2 < 6.10;
  return {
    body: { rotation: [cos(fase), 0, 0], position: [0, 1 + cos(fase + 65) * 0.2, cos(fase) * 0.1] },
    head: { rotation: [cos(fase - 90) * 0.5, 0, 0], position: [0, -0.5, 0] },
    face: { position: [0, 0.5, 0] },
    head_hidden: { position: [0, 1.5, 0] },
    shell_top: { rotation: [5 + cos(fase - 105) * 0.45, 0, 0] },
    shell_bottom: { rotation: [-2.5, 0, 0] },
    tongue: { rotation: [-17.5 + cos(fase - 125) * 2, 0, 0] },
    tongue2: { rotation: [-10 + cos(fase - 180) * 3, 0, 0] },
    eyelid_left: { position: [0, 0, piscando ? -0.15 : 0] },
    eyelid_right: { position: [0, 0, piscando ? -0.15 : 0] },
  };
}

export function nadoShellder(tempo) {
  const fase = tempo * 360;
  const pulso = sin(fase - 125 + sin(fase - 125) * 50);
  const a = repousoShellder(tempo);
  a.body = { rotation: [cos(fase) + pulso, 0, 0], position: [0, 1 + cos(fase + 65) * 0.2, 0] };
  a.head = { rotation: [sin(fase - 165 + sin(fase - 165) * 50) * 2, 0, 0],
    position: [0, -0.5, 0], scale: [1, 1 - pulso * 0.1, 1] };
  a.shell_top = { rotation: [5 - pulso * 6, 0, 0] };
  a.shell_bottom = { rotation: [-2.5 + pulso * 4, 0, 0] };
  a.tongue = { rotation: [-7.5 + sin(fase - 105 + sin(fase - 105) * 30) * 8, 0, 0],
    scale: [1, 1, 1 + sin(fase - 135 + sin(fase - 135) * 30) * 0.2] };
  a.tongue2 = { rotation: [-5 + sin(fase - 155 + sin(fase - 155) * 30) * 6, 0, 0] };
  return a;
}
