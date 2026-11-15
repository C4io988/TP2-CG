import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { criarGeometriaPraia, posicaoNaPraia } from '../src/praia.js';
import { criarNavegacao } from '../src/navegacao.js';
import { criarPasseioSlowpoke } from '../src/personagens.js';
import { criarPasseioShellder } from '../src/shellder.js';
import { criarInteracaoCauda } from '../src/interacao.js';
import { criarPasseioSlowbro } from '../src/slowbro.js';
import { criarEvolucao } from '../src/evolucao.js';

// Usa as geometrias reais sem criar buffers/texturas de GPU no teste Node.
async function semGPU(arquivo, trocas) {
  const url = new URL(arquivo, import.meta.url);
  let fonte = await readFile(url, 'utf8');
  fonte = fonte.replace(/from '([^']+)'/g, (_, caminho) => `from '${new URL(caminho, url)}'`);
  for (const [antes, depois] of trocas) fonte = fonte.replace(antes, depois);
  return import('data:text/javascript;base64,' + Buffer.from(fonte).toString('base64'));
}
const { criarModelo } = await semGPU('../src/cobblemon.js', [
  ['twgl.createBufferInfoFromArrays(gl, dados)', 'null'],
]);
const { criarCenario } = await semGPU('../src/cenario.js', [
  ['primitives.createCubeBufferInfo(gl, 1)', 'null'],
  ['criarTexturasCenario(gl)', '({})'],
]);
async function modelo(nome) {
  const json = JSON.parse(await readFile(new URL(`../assets/pokemon/models/${nome}.geo.json`, import.meta.url)));
  if (nome !== 'slowpoke') for (const fonte of json['minecraft:geometry']) {
    for (const osso of fonte.bones) {
      if (osso.rotation) osso.rotation[0] *= -1;
      for (const cubo of osso.cubes || []) if (cubo.rotation) cubo.rotation[0] *= -1;
    }
  }
  return criarModelo(null, json);
}
const praia = criarGeometriaPraia(15.82);
const cenario = criarCenario(null, praia.alturaTerreno);
const nav = criarNavegacao(praia.alturaTerreno, cenario.objetos);
let seed = Number(process.env.SEED || 1);
const aleatorio = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const [x, z] = posicaoNaPraia(-3);
const poke = criarPasseioSlowpoke(nav, [x, 0.23 + praia.alturaTerreno(x, z), z], aleatorio);
const shell = criarPasseioShellder(nav, aleatorio, praia.profundidadeAgua);
const bro = criarPasseioSlowbro(nav);
poke.definirModelo(await modelo('slowpoke'));
const concha = await modelo('shellder');
shell.definirModelo(concha);
bro.definirModelo(await modelo('slowbro'));
const interacao = criarInteracaoCauda(poke, shell, nav, praia.profundidadeAgua);
interacao.definirModelo(concha);
const evolucao = criarEvolucao(interacao, poke, bro);
for (let i = 0; i < Number(process.env.ESPERA || 0) * 20; i++) {
  poke.atualizar(0.05);
  shell.atualizar(0.05);
}
poke.definirModoPose(process.env.MODO_POSE || 'instantaneo');
for (let i = 0; i < 4; i++) poke.proximaPose();
let ultimo = '';
for (let i = 0; i < 3600 && evolucao.estado !== 'complete'; i++) {
  if (!bro.visivel) {
    poke.atualizar(0.05);
    shell.atualizar(0.05, i * 0.05);
    interacao.atualizar(0.05, true);
  }
  evolucao.atualizar(0.05, true);
  bro.atualizar(0.05);
  const estado = `${poke.poseConcluida}/${interacao.estado}/${evolucao.estado}`;
  if (estado !== ultimo) { console.log((i * 0.05).toFixed(1), estado); ultimo = estado; }
}
assert.equal(evolucao.estado, 'complete', 'Shellder deve alcançar a cauda e concluir a evolução');
assert(bro.visivel);
const margem = [...bro.posicao];
for (let i = 0; i < 1200; i++) bro.atualizar(0.05);
assert(Math.hypot(bro.posicao[0] - margem[0], bro.posicao[2] - margem[2]) > 2,
  'Slowbro deve conseguir sair da margem após evoluir');
console.log('Evolução concluída com os modelos, obstáculos e limites circulares reais.');
