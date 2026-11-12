import * as twgl from '../vendor/twgl-full.module.js';

export function criarEfeitoEvolucao(gl, shaders) {
  const programa = twgl.createProgramInfo(gl, [shaders.vertexShader, shaders.fragmentShader]);
  if (!programa) throw new Error('Falha ao preparar os shaders da evolução.');
  const cubo = twgl.primitives.createCubeBufferInfo(gl, 1);
  const { m4 } = twgl;
  return {
    desenhar(viewProjection, centro, progresso) {
      if (progresso <= 0 || progresso >= 1) return;
      gl.useProgram(programa.program);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      try {
        twgl.setBuffersAndAttributes(gl, programa, cubo);
        for (let i = 0; i < 40; i++) {
          const fase = (progresso * 1.6 + i / 40) % 1;
          const angulo = i * 2.39996 + progresso * 5;
          const raio = 1.1 + Math.sin(i * 7.3) * 0.5 + fase * 0.6;
          const posicao = [centro[0] + Math.cos(angulo) * raio,
            centro[1] + 0.2 + fase * 3.8, centro[2] + Math.sin(angulo) * raio];
          const tamanho = 0.06 + (i % 3) * 0.025;
          const world = m4.scale(m4.translation(posicao), [tamanho, tamanho, tamanho]);
          twgl.setUniforms(programa, {
            u_worldViewProjection: m4.multiply(viewProjection, world),
            u_cor: i % 3 ? [1, 0.94, 0.65] : [0.65, 0.9, 1],
            u_opacidade: Math.sin(progresso * Math.PI) * Math.sin(fase * Math.PI),
          });
          twgl.drawBufferInfo(gl, cubo);
        }
      } finally {
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
      }
    },
  };
}
