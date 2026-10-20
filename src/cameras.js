import { m4 } from '../vendor/twgl-full.module.js';
import { MEIA_BASE, ALTURA_SUPERFICIE } from './base.js';

export function criarCameras(canvas) {
  let modo = 1;
  let azimuteAutomatico = 0.35;
  const manual = { azimute: 0.35, elevacao: 0.62 };
  let distancia = MEIA_BASE * 3.5;
  let arrasto = null;
  const alvo = [0, ALTURA_SUPERFICIE, 0];
  const limitar = (valor, minimo, maximo) => Math.max(minimo, Math.min(maximo, valor));

  function encerrarArrasto() {
    const id = arrasto?.id;
    arrasto = null;
    if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }

  function selecionar(numero) {
    if (numero !== 1 && numero !== 2) return;
    encerrarArrasto();
    modo = numero;
  }

  window.addEventListener('keydown', evento => {
    const foco = document.activeElement;
    if (evento.repeat || evento.ctrlKey || evento.altKey || evento.metaKey
      || ['INPUT', 'SELECT', 'TEXTAREA'].includes(foco?.tagName) || foco?.isContentEditable) return;
    if (evento.key === '1' || evento.key === '2') selecionar(Number(evento.key));
  });

  canvas.addEventListener('pointerdown', evento => {
    if (modo !== 2 || evento.button !== 0 || arrasto) return;
    arrasto = { id: evento.pointerId, x: evento.clientX, y: evento.clientY };
    canvas.setPointerCapture(evento.pointerId);
  });
  canvas.addEventListener('pointermove', evento => {
    if (!arrasto || arrasto.id !== evento.pointerId) return;
    manual.azimute -= (evento.clientX - arrasto.x) * 0.008;
    manual.elevacao = limitar(manual.elevacao + (evento.clientY - arrasto.y) * 0.008, 0.08, 1.4);
    arrasto.x = evento.clientX;
    arrasto.y = evento.clientY;
  });
  canvas.addEventListener('pointerup', encerrarArrasto);
  canvas.addEventListener('pointercancel', encerrarArrasto);
  canvas.addEventListener('lostpointercapture', () => { arrasto = null; });

  canvas.addEventListener('wheel', evento => {
    evento.preventDefault();
    const delta = evento.deltaY * (evento.deltaMode === 1 ? 16 : evento.deltaMode === 2 ? canvas.clientHeight : 1);
    // Zoom compartilhado: trocar de câmera mantém a distância escolhida.
    distancia = limitar(distancia * Math.exp(limitar(delta, -200, 200) * 0.001), MEIA_BASE * 0.65, MEIA_BASE * 6.5);
  }, { passive: false });

  return {
    get modo() { return modo; },
    selecionar,
    atualizar(delta) {
      azimuteAutomatico = (azimuteAutomatico + Math.min(delta, 0.05) * 0.12) % (Math.PI * 2);
    },
    matrizes(aspecto) {
      const azimute = modo === 1 ? azimuteAutomatico : manual.azimute;
      const elevacao = modo === 1 ? Math.PI / 4 : manual.elevacao;
      const horizontal = Math.cos(elevacao) * distancia;
      const eye = [Math.sin(azimute) * horizontal,
        alvo[1] + Math.sin(elevacao) * distancia, Math.cos(azimute) * horizontal];
      // Preserva a precisão de profundidade usada na correção dos olhos.
      const projection = m4.perspective(Math.PI / 4, aspecto, 1, distancia + MEIA_BASE * 2);
      const view = m4.inverse(m4.lookAt(eye, alvo, [0, 1, 0]));
      return { eye, viewProjection: m4.multiply(projection, view) };
    },
  };
}
