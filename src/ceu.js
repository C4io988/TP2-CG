import * as twgl from '../vendor/twgl-full.module.js';
import { COR_CEU } from './ambiente.js';

// As seis faces compartilham a mesma função de direção para evitar emendas.
export function criarFacesCeu(lado = 256) {
  const direcoes = [
    (u, v) => [1, -v, -u], (u, v) => [-1, -v, u],
    (u, v) => [u, 1, v], (u, v) => [u, -1, -v],
    (u, v) => [u, -v, 1], (u, v) => [-u, -v, -1],
  ];
  const misturar = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  function cor(direcao) {
    const [x, y, z] = direcao;
    const altura = y / Math.hypot(x, y, z);
    const base = altura >= 0
      ? misturar(COR_CEU, [0.16, 0.40, 0.68], Math.pow(altura, 0.65))
      : misturar(COR_CEU, [0.31, 0.48, 0.65], Math.pow(-altura, 0.65));
    return base;
  }

  return direcoes.map(direcao => {
    const pixels = new Uint8Array(lado * lado * 4);
    for (let y = 0; y < lado; y++) {
      for (let x = 0; x < lado; x++) {
        const rgb = cor(direcao((x + 0.5) / lado * 2 - 1, (y + 0.5) / lado * 2 - 1));
        const i = (y * lado + x) * 4;
        pixels.set([...rgb.map(v => Math.round(v * 255)), 255], i);
      }
    }
    return pixels;
  });
}

export function criarCeu(gl, shaders) {
  const programa = twgl.createProgramInfo(gl, [shaders.vertexShader, shaders.fragmentShader]);
  if (!programa) throw new Error('Falha ao preparar os shaders do céu.');
  const tela = twgl.createBufferInfoFromArrays(gl, {
    position: { numComponents: 2, data: [-1, -1, 3, -1, -1, 3] },
  });
  const textura = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, textura);
  const flipAnterior = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  criarFacesCeu().forEach((pixels, face) => {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.RGBA,
      256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  });
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipAnterior);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return {
    desenhar(viewProjection, eye, noite = 0, tempo = 0) {
      // Só a direção do olhar importa: o cubo nunca pode ser alcançado pelo zoom.
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      try {
        gl.useProgram(programa.program);
        twgl.setBuffersAndAttributes(gl, programa, tela);
        twgl.setUniforms(programa, {
          u_inversaViewProjection: twgl.m4.inverse(viewProjection),
          u_cameraPosition: eye,
          u_ceu: textura,
          u_noite: noite,
          u_tempo: tempo,
        });
        twgl.drawBufferInfo(gl, tela);
      } finally {
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
      }
    },
  };
}
