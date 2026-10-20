import { createTexture } from '../vendor/twgl-full.module.js';

// Texturas próprias: pixels e paletas inspirados em cenários de blocos.
// Não utiliza arquivos de textura do Minecraft.
export function criarTexturasPraia(gl) {
  function ruido(x, y, seed) {
    let valor = Math.imul(x + seed, 374761393) ^ Math.imul(y + seed, 668265263);
    valor = Math.imul(valor ^ (valor >>> 13), 1274126177);
    return ((valor ^ (valor >>> 16)) >>> 0) / 4294967296;
  }

  function textura(lado, pixel) {
    const dados = new Uint8Array(lado * lado * 4);
    for (let y = 0; y < lado; y++) {
      for (let x = 0; x < lado; x++) dados.set([...pixel(x, y), 255], (y * lado + x) * 4);
    }
    return createTexture(gl, {
      src: dados, width: lado, height: lado,
      mag: gl.NEAREST,
      min: gl.NEAREST_MIPMAP_LINEAR,
      wrapS: gl.REPEAT, wrapT: gl.REPEAT,
    });
  }

  const tonsAreia = [[223, 205, 151], [231, 214, 163], [237, 221, 174], [215, 195, 140]];
  const areia = textura(16, (x, y) => {
    const valor = ruido(x, y, 11);
    return tonsAreia[valor < 0.15 ? 3 : valor < 0.40 ? 0 : valor < 0.83 ? 1 : 2];
  });
  const tonsAgua = [[43, 111, 184], [48, 122, 195], [54, 133, 204], [67, 147, 212]];
  const agua = textura(32, (x, y) => {
    // Pequenos traços em degraus sugerem ondulações sem animar a água nesta etapa.
    const faixa = (y + Math.floor(2 * Math.sin(x * Math.PI / 8)) + 32) % 8;
    if (faixa === 0 && ruido(Math.floor(x / 4), Math.floor(y / 8), 23) > 0.35) return tonsAgua[3];
    const valor = ruido(x, y, 22);
    return tonsAgua[valor < 0.2 ? 0 : valor < 0.8 ? 1 : 2];
  });
  return { areia, agua };
}
