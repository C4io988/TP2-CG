import * as twgl from '../vendor/twgl-full.module.js';
import { criarBase, ALTURA_SUPERFICIE } from './base.js';
import { criarCameras } from './cameras.js';
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
  const cameras = criarCameras(canvas);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  let previousTime = null;
  let animationTime = 0;

  function render(now) {
    const delta = previousTime === null ? 0 : Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    animationTime += delta;
    cameras.atualizar(delta);
    twgl.resizeCanvasToDisplaySize(canvas, Math.min(window.devicePixelRatio || 1, 2));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.894, 0.929, 0.945, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const { viewProjection } = cameras.matrizes(canvas.width / Math.max(canvas.height, 1));

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
