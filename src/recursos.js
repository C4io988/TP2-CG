import * as twgl from '../vendor/twgl-full.module.js';
import { criarModelo } from './cobblemon.js';

export async function carregarShaders(nome = 'basico') {
  async function carregarTexto(arquivo) {
    const url = new URL(`./shaders/${arquivo}`, import.meta.url);
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Shader ${arquivo}: HTTP ${resposta.status}`);
    return resposta.text();
  }

  const [vertexShader, fragmentShader] = await Promise.all([
    carregarTexto(`${nome}.vert.glsl`),
    carregarTexto(`${nome}.frag.glsl`),
  ]);
  return { vertexShader, fragmentShader };
}

export async function carregarSlowpoke(gl) {
  return carregarPokemon(gl, 'slowpoke');
}

export async function carregarShellder(gl) {
  return carregarPokemon(gl, 'shellder');
}

async function carregarPokemon(gl, nome) {
  // Caminhos relativos ao módulo para funcionar também em subdiretórios.
  const modeloUrl = new URL(`../assets/pokemon/models/${nome}.geo.json`, import.meta.url);
  const texturaUrl = new URL(`../assets/pokemon/textures/${nome}.png`, import.meta.url);
  const [geometria, imagem] = await Promise.all([
    carregarJson(modeloUrl),
    carregarImagem(texturaUrl),
  ]);

  if (nome === 'shellder') {
    // No nosso sistema de eixos, inverte X para as metades da concha abrirem.
    for (const fonte of geometria['minecraft:geometry']) {
      for (const osso of fonte.bones) {
        if (osso.rotation) osso.rotation[0] *= -1;
        for (const cubo of osso.cubes || []) if (cubo.rotation) cubo.rotation[0] *= -1;
      }
    }
  }

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
  if (!resposta.ok) throw new Error(`Modelo ${url.pathname.split('/').at(-1)}: HTTP ${resposta.status}`);
  return resposta.json();
}

async function carregarImagem(url) {
  const imagem = new Image();
  imagem.src = url.href;
  try {
    await imagem.decode();
  } catch {
    throw new Error(`Não foi possível carregar a textura ${url.pathname.split('/').at(-1)}.`);
  }
  return imagem;
}
