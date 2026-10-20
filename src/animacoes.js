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
    tail: { rotation: [20 - sin(fase - 30) * 3, -cos(fase / 2 - 30) * 2, 0] },
    tail2: { rotation: [45 - sin(fase - 90) * 3, -cos(fase / 2 - 90) * 2, 0] },
    tail3: { rotation: [40 - sin(fase - 120) * 5, -cos(fase / 2 - 120) * 5, 0] },
    tail4: { rotation: [10 - sin(fase - 160) * 2, -cos(fase / 2 - 160) * 6, 0] },
  };
}
