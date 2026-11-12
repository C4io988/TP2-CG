// Adaptações dos clipes originais do Cobblemon, sem interpretar Molang.
const sin = graus => Math.sin(graus * Math.PI / 180);
const cos = graus => Math.cos(graus * Math.PI / 180);
const limitar = (v, min, max) => Math.max(min, Math.min(max, v));

function converterX(a) {
  for (const osso of Object.values(a)) if (osso.rotation) osso.rotation[0] *= -1;
  return a;
}

function piscadas(a, tempo) {
  if (tempo % 6.1 > 5.9) {
    a.eye_left = { position: [-0.1, 0, 0.1] };
    a.eye_right = { position: [0.1, 0, 0.1] };
    a.eyelid_left = { position: [0.1, 0, -0.18] };
    a.eyelid_right = { position: [-0.1, 0, -0.18] };
  }
  if (tempo % 7.3 > 7.1) {
    a.eye_shell_left = a.eye_shell_right = { position: [0, -0.12, 0] };
    a.eyelid_shell_left = a.eyelid_shell_right = { position: [0, 0.18, 0] };
  }
  return a;
}

function dedos(a) {
  for (const lado of ['left', 'right']) {
    for (const dedo of ['front', 'middle', 'back']) {
      a[`finger_${dedo}_${lado}`] = { rotation: [0, 0, lado === 'left' ? 40 : -40] };
    }
  }
}

export function repousoSlowbro(tempo) {
  const f = tempo * 135;
  const a = {
    tail: { rotation: [-38.15, 14.08 - cos(f - 60) * 5, -5.24] },
    tail2: { rotation: [35, -cos(f - 120), 0] },
    torso: { rotation: [10 - cos(f), 0, 0], position: [0, -sin(f) * 0.3, 0] },
    head: { rotation: [-5 - cos(f - 30), 0, 0] },
    arm_left: { rotation: [-20, 48, 41 - cos(f - 30) * 3] },
    arm_left2: { rotation: [0, 0, 62.5 - cos(f - 60) * 2] },
    arm_right: { rotation: [-20, -48, -41 + cos(f - 30) * 3] },
    arm_right2: { rotation: [0, 0, -62.5 + cos(f - 60) * 2] },
    ear_left: { rotation: [-cos(f - 60) * 6, 0, 0] },
    jaw: { rotation: [50 - cos(f - 60) * 5, 0, 0] },
    shell: { rotation: [-15 - cos(f) * 0.5, -cos(f - 120) * 0.5, 0] },
    shell_jaw: { rotation: [10 - cos(f - 30), 0, 0] },
    leg_left: { rotation: [0, -7.5, 0] }, leg_right: { rotation: [0, 12.5, 0] },
  };
  dedos(a);
  return piscadas(converterX(a), tempo);
}

function quadro(tempo, valores) {
  for (let i = 1; i < valores.length; i++) {
    if (tempo > valores[i][0]) continue;
    const [ta, a] = valores[i - 1], [tb, b] = valores[i];
    return a + (b - a) * limitar((tempo - ta) / (tb - ta), 0, 1);
  }
  return valores.at(-1)[1];
}

export function caminhadaSlowbro(tempo) {
  const f = tempo * 180, t = tempo % 2;
  const a = {
    torso: { rotation: [12.5 + cos(f * 2) * 2, -cos(f) * 5, -sin(f) * 5], position: [0, sin(f * 2) * 0.2, 0] },
    head: { rotation: [-10 - cos(f * 2 - 60) * 3, cos(f - 60) * 8, sin(f - 60) * 2] },
    ear_left: { rotation: [-cos(f * 2 - 120) * 4, 0, 0] },
    jaw: { rotation: [45 + cos(f * 2 - 60) * 2, 0, 0] },
    arm_left: { rotation: [-20 + sin(f - 30) * 4, 48, 41] },
    arm_left2: { rotation: [0, 0, 50 + sin(f - 60) * 2] },
    arm_right: { rotation: [-20 + sin(f - 30) * 4, -48, -41] },
    arm_right2: { rotation: [0, 0, -50 - sin(f - 60) * 2] },
    tail: { rotation: [-18.3076 + sin(f * 2 - 60) * 2, 16.8595 - cos(f - 60) * 4, -4.28583] },
    tail2: { rotation: [20 + sin(f * 2 - 120), -cos(f - 120) * 4, 0] },
    shell: { rotation: [-7.5 - sin(f * 2 - 180) * 2, -cos(f - 120), 0] },
    shell_jaw: { rotation: [sin(f * 2 - 180) * 2, 0, 0] },
    body: { rotation: [0, -cos(f) * 3, 0] },
    leg_left: { rotation: [0.0577 + cos(f) * 5, -9.98078, -0.44192], position: [0,
      quadro(t, [[0, -0.1 + Math.max(0, sin(f))], [0.8333, Math.max(0, sin(f))], [0.9167, 0], [2, -0.1 + Math.max(0, sin(f))]]), 0.3 + cos(f) * 0.5] },
    leg_left2: { rotation: [-sin(f) * 5, 0, 0] },
    leg_right: { rotation: [-0.0239 + cos(f - 180) * 5, 7.49044, -0.21969], position: [0,
      quadro(t, [[0, Math.max(0, sin(f + 180))], [1.875, Math.max(0, sin(f + 180))], [1.9167, 0], [2, Math.max(0, sin(f + 180))]]), 0.3 + cos(f + 180) * 0.5] },
    leg_right2: { rotation: [-sin(f) * 5, 0, 0] },
  };
  const peEsquerdo = -limitar(sin(f) * 10, 0, 10) + limitar(sin(f + 30) * 12, 0, 12);
  const peDireito = -limitar(sin(f - 180) * 10, 0, 10) + limitar(sin(f - 150) * 12, 0, 12);
  a.foot_left = { rotation: [quadro(t, [[0, -10 + peEsquerdo], [0.8333, 1.5 + peEsquerdo], [0.9583, 5], [1.5, -5.3], [2, -10 + peEsquerdo]]), 0, 0],
    position: [0, quadro(t, [[0, 0], [1.5, -0.15], [1.9167, -0.15], [2, 0]]), 0] };
  a.foot_right = { rotation: [quadro(t, [[0, 5 + peDireito], [0.375, 5 + peDireito], [0.8333, -2 + peDireito], [1, -9.5 + peDireito], [1.7917, peDireito], [1.9583, 5 + peDireito], [2, 5 + peDireito]]), 0, 0],
    position: [0, quadro(t, [[0, 0], [0.8333, -0.1], [2, 0]]), 0] };
  dedos(a);
  a.finger_front_left.rotation[2] += sin(tempo * 270 - 90) * 2;
  return piscadas(converterX(a), tempo);
}
