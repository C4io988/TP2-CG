import * as twgl from '../vendor/twgl-full.module.js';
import { criarModelo } from './cobblemon.js';

export async function carregarSlowpoke(gl) {
  // Caminhos relativos ao módulo para funcionar também em subdiretórios.
  const modeloUrl = new URL('../assets/pokemon/models/slowpoke.geo.json', import.meta.url);
  const texturaUrl = new URL('../assets/pokemon/textures/slowpoke.png', import.meta.url);
  const [geometria, imagem] = await Promise.all([
    carregarJson(modeloUrl),
    carregarImagem(texturaUrl),
  ]);

  const textura = twgl.createTexture(gl, {
    src: imagem,
    flipY: false, // UVs Bedrock medidos a partir do topo da imagem.
    min: gl.NEAREST,
    mag: gl.NEAREST,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
    auto: false,
  });
  return { ossos: criarModelo(gl, geometria), textura };
}

async function carregarJson(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Modelo Slowpoke: HTTP ${resposta.status}`);
  return resposta.json();
}

async function carregarImagem(url) {
  const imagem = new Image();
  imagem.src = url.href;
  try {
    await imagem.decode();
  } catch {
    throw new Error('Não foi possível carregar a textura do Slowpoke.');
  }
  return imagem;
}
