import * as twgl from '../vendor/twgl-full.module.js';
import { criarBase, ALTURA_SUPERFICIE } from './base.js';
import { criarCameras } from './cameras.js';
import { carregarSlowpoke, carregarShellder, carregarSlowbro, carregarShaders } from './recursos.js';
import { desenharModelo } from './cobblemon.js';
import { posicaoNaPraia } from './praia.js';
import { criarCenario } from './cenario.js';
import { criarNavegacao } from './navegacao.js';
import { criarPasseioSlowpoke } from './personagens.js';
import { criarAgua } from './agua.js';
import { criarPasseioShellder, ESCALA_SHELLDER } from './shellder.js';
import { MATERIAIS } from './materiais.js';
import { criarInteracaoCauda } from './interacao.js';
import { criarPasseioSlowbro, ESCALA_SLOWBRO } from './slowbro.js';
import { criarEfeitoEvolucao } from './efeito-evolucao.js';
import { criarEvolucao } from './evolucao.js';
import { criarAmbiente, COR_CEU } from './ambiente.js';

const canvas = document.querySelector('#cena');
const errorMessage = document.querySelector('#erro');
const modoPoses = document.querySelector('#modo-poses');

iniciar().catch(mostrarErro);

function mostrarErro(error) {
  errorMessage.textContent = `Não foi possível abrir a cena: ${error.message}`;
  errorMessage.hidden = false;
  console.error(error);
}

async function iniciar() {
  const gl = canvas.getContext('webgl', { antialias: true });
  if (!gl) throw new Error('WebGL não está disponível neste navegador.');

  // Inicia os downloads antes de preparar os shaders, a ilha e a navegação.
  const slowpokePronto = carregarSlowpoke(gl).catch(mostrarErro);
  const shellderPronto = carregarShellder(gl).catch(mostrarErro);
  const slowbroPronto = carregarSlowbro(gl).catch(mostrarErro);
  const [shadersBasicos, shadersAgua, shadersEvolucao] = await Promise.all([
    carregarShaders(), carregarShaders('agua'), carregarShaders('evolucao'),
  ]);
  const { vertexShader, fragmentShader } = shadersBasicos;
  const program = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
  if (!program) throw new Error('Falha ao preparar os shaders.');
  const { partes: parts, agua: superficieAgua, alturaTerreno, profundidadeAgua } = criarBase(gl);
  const agua = criarAgua(gl, superficieAgua, shadersAgua);
  const efeitoEvolucao = criarEfeitoEvolucao(gl, shadersEvolucao);
  const cenario = criarCenario(gl, alturaTerreno);
  parts.push(...cenario.partes);
  // Um pouco mais para o interior, com as quatro patas sobre o patamar de areia.
  const [slowpokeX, slowpokeZ] = posicaoNaPraia(-3);
  const slowpokePosition = [slowpokeX,
    ALTURA_SUPERFICIE + alturaTerreno(slowpokeX, slowpokeZ) + 0.01, slowpokeZ];
  const navegacao = criarNavegacao(alturaTerreno, cenario.objetos);
  const passeio = criarPasseioSlowpoke(navegacao, slowpokePosition);
  const nado = criarPasseioShellder(navegacao, Math.random, profundidadeAgua);
  const interacao = criarInteracaoCauda(passeio, nado, navegacao, profundidadeAgua);
  const passeioSlowbro = criarPasseioSlowbro(navegacao);
  const evolucao = criarEvolucao(interacao, passeio, passeioSlowbro);
  const whiteTexture = twgl.createTexture(gl, { src: [255, 255, 255, 255] });
  let slowpoke = null;
  let shellder = null;
  let slowbro = null;
  slowpokePronto.then(modelo => {
    if (!modelo) return;
    passeio.definirModelo(modelo.ossos);
    slowpoke = modelo;
  }).catch(mostrarErro);
  shellderPronto.then(modelo => {
    if (!modelo) return;
    nado.definirModelo(modelo.ossos);
    interacao.definirModelo(modelo.ossos);
    shellder = modelo;
  }).catch(mostrarErro);
  const { m4 } = twgl;
  slowbroPronto.then(modelo => {
    if (!modelo) return;
    passeioSlowbro.definirModelo(modelo.ossos);
    slowbro = modelo;
  }).catch(mostrarErro);
  const cameras = criarCameras(canvas);
  const ambiente = criarAmbiente();
  modoPoses.addEventListener('change', evento => {
    passeio.definirModoPose(evento.target.value);
    canvas.focus({ preventScroll: true });
  });
  let iluminacaoAtiva = true;

  window.addEventListener('keydown', evento => {
    const foco = document.activeElement;
    if (evento.repeat || evento.ctrlKey || evento.altKey || evento.metaKey
      || ['INPUT', 'SELECT', 'TEXTAREA'].includes(foco?.tagName) || foco?.isContentEditable) return;
    const tecla = evento.key.toLowerCase();
    if (tecla === 'l') iluminacaoAtiva = !iluminacaoAtiva;
    if (tecla === 'n') ambiente.alternarNeblina();
    if (tecla === 'm' && !evolucao.bloqueada) {
      if (passeioSlowbro.visivel) passeioSlowbro.alternarPasseio();
      else {
        interacao.cancelar();
        passeio.alternarPasseio();
        nado.definirAtivo(passeio.ativo);
      }
    }
    if (tecla === 'p' && slowpoke && !evolucao.bloqueada && !passeioSlowbro.visivel) {
      interacao.cancelar();
      passeio.proximaPose();
    }
    if (tecla === 'r') {
      interacao.reiniciar();
      passeio.reiniciar();
      nado.reiniciar();
      passeioSlowbro.reiniciar();
      evolucao.reiniciar();
    }
  });

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  let previousTime = null;
  let animationTime = 0;

  function render(now) {
    const delta = previousTime === null ? 0 : Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    animationTime += delta;
    cenario.atualizar(animationTime);
    cameras.atualizar(delta);
    if (!passeioSlowbro.visivel) {
      if (slowpoke) passeio.atualizar(delta);
      if (shellder) nado.atualizar(delta, animationTime);
      interacao.atualizar(delta, Boolean(slowpoke && shellder && slowbro));
    }
    try {
      evolucao.atualizar(delta, Boolean(slowbro));
    } catch (erro) {
      mostrarErro(erro);
    }
    passeioSlowbro.atualizar(delta);
    modoPoses.disabled = evolucao.bloqueada || passeioSlowbro.visivel;
    twgl.resizeCanvasToDisplaySize(canvas, Math.min(window.devicePixelRatio || 1, 2));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...COR_CEU, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const { eye, viewProjection } = cameras.matrizes(canvas.width / Math.max(canvas.height, 1));

    gl.useProgram(program.program);
    const iluminacao = {
      ...ambiente.uniforms(eye, animationTime),
      ...cenario.luzFogueira(animationTime),
      u_cameraPosition: eye,
      u_lightDirection: [-0.5, 1, 0.8],
      u_lightColor: [1, 0.97, 0.90],
      u_ambientColor: [0.90, 0.95, 1],
      u_lightOn: iluminacaoAtiva,
    };
    twgl.setUniforms(program, { ...iluminacao, u_brilhoEvolucao: 0, u_viewProjection: viewProjection });
    gl.enable(gl.CULL_FACE);
    for (const part of parts) {
      twgl.setBuffersAndAttributes(gl, program, part.buffer);
      twgl.setUniforms(program, {
        ...part.material,
        u_world: part.world,
        u_worldViewProjection: m4.multiply(viewProjection, part.world),
        u_worldInverseTranspose: m4.transpose(m4.inverse(part.world)),
        u_color: part.color,
        u_emissao: part.emissao || 0,
        u_useTexture: Boolean(part.texture),
        u_texture: part.texture || whiteTexture,
        u_folha: Boolean(part.vento),
        u_folhaOrigem: part.vento?.origem || [0, 0, 0],
        u_folhaAlcance: part.vento?.alcance || 1,
        u_folhaIntensidade: part.vento?.intensidade || 0,
      });
      twgl.drawBufferInfo(gl, part.buffer);
    }

    if (slowpoke && !passeioSlowbro.visivel) {
      // Rosto e ponta da cauda incluem planos sem espessura: desenhar os dois lados.
      gl.disable(gl.CULL_FACE);
      desenharModelo(gl, program, slowpoke.ossos, slowpoke.textura,
        passeio.animacao(), viewProjection,
        passeio.posicao, 0.18, passeio.angulo, MATERIAIS.slowpoke, evolucao.brilho);
    }
    if (shellder && !passeioSlowbro.visivel) {
      gl.disable(gl.CULL_FACE);
      desenharModelo(gl, program, shellder.ossos, shellder.textura,
        nado.animacao(), viewProjection, nado.posicao, ESCALA_SHELLDER, nado.angulo, MATERIAIS.shellder, evolucao.brilho);
    }
    if (slowbro && passeioSlowbro.visivel) {
      gl.disable(gl.CULL_FACE);
      desenharModelo(gl, program, slowbro.ossos, slowbro.textura,
        passeioSlowbro.animacao(), viewProjection, passeioSlowbro.posicao,
        ESCALA_SLOWBRO, passeioSlowbro.angulo, MATERIAIS.slowpoke, evolucao.brilho);
    }
    efeitoEvolucao.desenhar(viewProjection, evolucao.centro, evolucao.progresso, iluminacao);
    agua.desenhar(viewProjection, iluminacao, animationTime);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
