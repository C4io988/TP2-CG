import * as twgl from '../vendor/twgl-full.module.js';
import { MEIA_BASE } from './base.js';

export function criarAgua(gl, superficie, shaders) {
  const programa = twgl.createProgramInfo(gl, [shaders.vertexShader, shaders.fragmentShader]);
  if (!programa) throw new Error('Falha ao preparar os shaders da água.');
  return {
    desenhar(viewProjection, iluminacao, tempo) {
      // Água depois dos opacos: o fundo e a cauda aparecem através da superfície.
      gl.useProgram(programa.program);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      try {
        twgl.setBuffersAndAttributes(gl, programa, superficie.buffer);
        twgl.setUniforms(programa, {
          ...iluminacao, ...superficie.material,
          u_world: superficie.world,
          u_viewProjection: viewProjection,
          u_texture: superficie.texture,
          u_time: tempo,
          u_extent: MEIA_BASE - 0.18,
        });
        twgl.drawBufferInfo(gl, superficie.buffer);
      } finally {
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      }
    },
  };
}
