import { idleSlowpoke } from './animacoes.js';
import { posicaoNaPraia } from './praia.js';
import { ALTURA_SUPERFICIE } from './base.js';
import { alturaDeApoio, pontaDaCauda } from './cobblemon.js';

export function criarPoses() {
  return [
    { nome: 'centro', local: [-3, 0], angulo: Math.PI + 0.35 },
    { nome: 'dormindoDeitado', local: [9.5, 0], angulo: Math.PI + 0.35 },
    { nome: 'deitadoAcordado', local: [-1, -1.4], angulo: 0.35 - Math.PI / 2 },
    { nome: 'caudaNaAgua', local: [12, 0.3], angulo: 0.35, inclinacaoCauda: 25 },
  ].map(pose => {
    const [x, z] = posicaoNaPraia(...pose.local);
    return { ...pose, x, z };
  });
}

export function animacaoDaPose(indice, tempo, inclinacaoCauda = 25) {
  const a = idleSlowpoke(tempo);
  const respiracao = Math.sin(tempo * 1.5);
  if (indice === 0) return a;
  a.jaw = { rotation: [-32.5 + respiracao * 1.5, 0, 0] };

  // Adaptação da postura floor_idle do modelo, com patas abertas e barriga baixa.
  a.body = { position: [0, -1.5, 0] };
  a.torso = { rotation: [respiracao * 0.3, 0, 0] };
  a.head = { rotation: [indice === 3 ? -2.5 : 4, 0, 0] };
  for (const [nome, giroY] of [['leg_front_left', -37.5], ['leg_front_right', 37.5],
    ['leg_back_left', -60], ['leg_back_right', 60]]) {
    a[nome] = { rotation: [-90, giroY, 0], position: [0, -1, -0.5] };
  }
  if (indice === 1 || indice === 2) {
    a.tail = { rotation: [-8, -5, 0] };
    a.tail2 = { rotation: [-10, -5, 0] };
    a.tail3 = { rotation: [-6, -4, 0] };
    a.tail4 = { rotation: [0, -2, 0] };
  }
  if (indice === 1) {
    // Pálpebras da animação blink original, um pouco à frente para evitar z-fighting.
    a.eyelid_left = { position: [0.1, 0, -0.18] };
    a.eyelid_right = { position: [-0.1, 0, -0.18] };
    a.eye_left = { position: [-0.1, 0, 0.1] };
    a.eye_right = { position: [0.1, 0, 0.1] };
    a.jaw = { rotation: [0, 0, 0] };
  }
  if (indice === 2) {
    // Barriga apoiada, olhos na posição normal e mandíbula aberta.
    a.head = { rotation: [-2.5, 0, 0] };
    a.jaw = { rotation: [-32.5 + respiracao * 1.5, 0, 0] };
  } else if (indice === 3) {
    // A descida se concentra no fim da cauda, depois de ultrapassar a areia.
    a.tail = { rotation: [inclinacaoCauda * 0.5, 0, 0] };
    a.tail2 = { rotation: [inclinacaoCauda * 0.5 + 5, 0, 0] };
    a.tail3 = { rotation: [8, 0, 0] };
    a.tail4 = { rotation: [16, 0, 0] };
  }
  return a;
}

export function ajustarCaudaNaAgua(pose, ossos, alturaTerreno) {
  const animacao = animacaoDaPose(3, 0, pose.inclinacaoCauda);
  const y = ALTURA_SUPERFICIE + alturaDeApoio(ossos, animacao,
    pose.x, pose.z, pose.angulo, alturaTerreno, true) + 0.01;
  let minimo = 0, maximo = 65;
  // Ajusta o osso da cauda, mantendo o corpo apoiado na areia.
  for (let i = 0; i < 22; i++) {
    const meio = (minimo + maximo) / 2;
    const ponto = pontaDaCauda(ossos, animacaoDaPose(3, 0, meio), [pose.x, y, pose.z], pose.angulo);
    // Submerge uma parte visível da ponta, não só seu ponto central.
    if (ponto[1] > ALTURA_SUPERFICIE - 0.42) minimo = meio;
    else maximo = meio;
  }
  pose.inclinacaoCauda = (minimo + maximo) / 2;
}
