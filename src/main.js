import * as twgl from '../vendor/twgl-full.module.js';
import { criarBase, MEIA_BASE, ALTURA_SUPERFICIE, ALTURA_BASE } from './base.js';
import { carregarSlowpoke } from './recursos.js';
import { desenharModelo } from './cobblemon.js';
import { idleSlowpoke } from './animacoes.js';
import { posicaoNaPraia } from './praia.js';
import { vertexShader, fragmentShader } from './shaders/basico.js';

const canvas = document.querySelector('#cena');
const errorMessage = document.querySelector('#erro');

try {
  iniciar();
} catch (error) {
  mostrarErro(error);
}

function mostrarErro(error) {
  errorMessage.textContent = `Não foi possível abrir a cena: ${error.message}`;
  errorMessage.hidden = false;
  console.error(error);
}

function iniciar() {
  const gl = canvas.getContext('webgl', { antialias: true });
  if (!gl) throw new Error('WebGL não está disponível neste navegador.');

  const program = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
  if (!program) throw new Error('Falha ao preparar os shaders.');
  const { partes: parts, alturaTerreno } = criarBase(gl);
  // Um pouco mais para o interior, com as quatro patas sobre o patamar de areia.
  const [slowpokeX, slowpokeZ] = posicaoNaPraia(-3);
  const slowpokePosition = [slowpokeX,
    ALTURA_SUPERFICIE + alturaTerreno(slowpokeX, slowpokeZ) + 0.01, slowpokeZ];
  const whiteTexture = twgl.createTexture(gl, { src: [255, 255, 255, 255] });
  let slowpoke = null;
  carregarSlowpoke(gl).then(modelo => { slowpoke = modelo; }).catch(mostrarErro);
  const { m4 } = twgl;
  const camera = { azimuth: 0.35, elevation: 0.62, distance: MEIA_BASE * 3.5 };
  let drag = null;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    camera.azimuth -= (event.clientX - drag.x) * 0.008;
    camera.elevation = clamp(camera.elevation + (event.clientY - drag.y) * 0.008, 0.08, 1.4);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });

  canvas.addEventListener('lostpointercapture', () => { drag = null; });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
    camera.distance = clamp(camera.distance * Math.exp(clamp(delta, -200, 200) * 0.001), MEIA_BASE * 0.65, MEIA_BASE * 6.5);
  }, { passive: false });

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  let previousTime = null;
  let animationTime = 0;

  function render(now) {
    const delta = previousTime === null ? 0 : Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    animationTime += delta;
    twgl.resizeCanvasToDisplaySize(canvas, Math.min(window.devicePixelRatio || 1, 2));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.894, 0.929, 0.945, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Enquadra a caixa inteira à distância e volta ao personagem ao aproximar.
    const enquadramentoBase = clamp((camera.distance - MEIA_BASE) / (MEIA_BASE * 2), 0, 1);
    const target = [0, ALTURA_SUPERFICIE - ALTURA_BASE * 0.25 * enquadramentoBase, 0];
    const horizontal = Math.cos(camera.elevation) * camera.distance;
    const eye = [
      Math.sin(camera.azimuth) * horizontal,
      target[1] + Math.sin(camera.elevation) * camera.distance,
      Math.cos(camera.azimuth) * horizontal,
    ];
    // Um plano próximo menos extremo melhora a separação entre olho e pupila.
    // O plano distante acompanha o zoom e mantém toda a base dentro da cena.
    const near = 1;
    const far = camera.distance + MEIA_BASE * 2;
    const projection = m4.perspective(Math.PI / 4, canvas.width / Math.max(canvas.height, 1), near, far);
    const view = m4.inverse(m4.lookAt(eye, target, [0, 1, 0]));
    const viewProjection = m4.multiply(projection, view);

    gl.useProgram(program.program);
    gl.enable(gl.CULL_FACE);
    for (const part of parts) {
      twgl.setBuffersAndAttributes(gl, program, part.buffer);
      twgl.setUniforms(program, {
        u_worldViewProjection: m4.multiply(viewProjection, part.world),
        u_worldInverseTranspose: m4.transpose(m4.inverse(part.world)),
        u_color: part.color,
        u_useTexture: Boolean(part.texture),
        u_texture: part.texture || whiteTexture,
      });
      twgl.drawBufferInfo(gl, part.buffer);
    }

    if (slowpoke) {
      // Rosto e ponta da cauda incluem planos sem espessura: desenhar os dois lados.
      gl.disable(gl.CULL_FACE);
      desenharModelo(gl, program, slowpoke.ossos, slowpoke.textura,
        idleSlowpoke(animationTime), viewProjection,
        slowpokePosition, 0.18, Math.PI);
    }
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
