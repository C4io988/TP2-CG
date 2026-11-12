import { ALTURA_SUPERFICIE } from './base.js';
import { posicaoNaPraia } from './praia.js';
import { criarPercursoSuave } from './personagens.js';
import { calcularMatrizes } from './cobblemon.js';
import { repousoShellder, nadoShellder, misturarAnimacoes } from './animacoes.js';

export const ESCALA_SHELLDER = 0.12;
const VELOCIDADE_NADO = 0.72;

export function criarPasseioShellder(navegacao, aleatorio = Math.random, profundidadeAgua = () => 0.60) {
  const componentes = new Map();
  for (const no of navegacao.grafos.agua.nos) {
    if (!componentes.has(no.componente)) componentes.set(no.componente, []);
    componentes.get(no.componente).push(no);
  }
  const maiorArea = [...componentes.values()].sort((a, b) => b.length - a.length)[0];
  if (!maiorArea?.length) throw new Error('Não há espaço aquático suficiente para Shellder.');
  const [alvoX, alvoZ] = posicaoNaPraia(11, -8);
  const espacoParaCurva = ponto => {
    for (let i = 0; i < 8; i++) {
      if (!navegacao.pontoValido({ x: ponto.x + Math.cos(i * Math.PI / 4) * 0.30,
        z: ponto.z + Math.sin(i * Math.PI / 4) * 0.30 }, 'agua')) return false;
    }
    return true;
  };
  const abertos = maiorArea.filter(espacoParaCurva);
  const inicio = (abertos.length ? abertos : maiorArea).slice()
    .sort((a, b) => Math.hypot(a.x - alvoX, a.z - alvoZ) - Math.hypot(b.x - alvoX, b.z - alvoZ))[0];
  const posicao = [inicio.x, ALTURA_SUPERFICIE - 0.28, inicio.z];
  let angulo = Math.PI + 0.35;
  let ativo = true, estado = 'idle', espera = 2.5;
  let percurso = [], proximo = 1, tempoPercurso = 0;
  let tempo = 0, mistura = 0, minimoModelo = -0.15;

  function atualizarFlutuacao() {
    // Mais submerso em águas profundas; mantém folga nos degraus rasos.
    const imersao = Math.min(0.95, profundidadeAgua(posicao[0], posicao[2], 1.65) - 0.12);
    const alturaBase = ALTURA_SUPERFICIE - imersao - minimoModelo;
    const onda = Math.sin(posicao[0] * 0.9 + posicao[2] * 0.35 + tempo * 1.3) * 0.024
      + Math.cos(posicao[2] * 0.8 - posicao[0] * 0.25 - tempo * 0.9) * 0.012;
    posicao[1] = alturaBase + onda + Math.sin(tempo * 1.4) * 0.015;
  }

  function escolherDestino() {
    const origem = { x: posicao[0], z: posicao[2] };
    const candidatos = navegacao.alvosAlcancaveis(origem, 'agua').filter(no => {
      const distancia = Math.hypot(no.x - origem.x, no.z - origem.z);
      return distancia >= 2 && distancia <= 9 && espacoParaCurva(no);
    });
    if (!candidatos.length) return;
    const primeiro = Math.min(candidatos.length - 1, Math.floor(aleatorio() * candidatos.length));
    for (let i = 0; i < Math.min(candidatos.length, 18); i++) {
      const destino = candidatos[(primeiro + i) % candidatos.length];
      const rota = navegacao.buscarRota(origem, destino, 'agua');
      if (!rota?.length) continue;
      for (const lado of [1, -1]) {
        const curva = criarPercursoSuave(navegacao, origem, angulo, rota, lado,
          { area: 'agua', velocidade: VELOCIDADE_NADO, giroMaximo: 1.7 });
        if (!curva) continue;
        percurso = curva;
        proximo = 1;
        tempoPercurso = 0;
        estado = 'swimming';
        return;
      }
    }
  }

  function reiniciar() {
    posicao[0] = inicio.x;
    posicao[2] = inicio.z;
    angulo = Math.PI + 0.35;
    ativo = true;
    estado = 'idle';
    espera = 2.5;
    percurso = [];
    proximo = 1;
    tempoPercurso = 0;
    tempo = 0;
    mistura = 0;
    atualizarFlutuacao();
  }

  return {
    posicao,
    get angulo() { return angulo; },
    get ativo() { return ativo; },
    get estado() { return estado; },
    definirAtivo(valor) { ativo = Boolean(valor); },
    definirModelo(ossos) {
      // Mede as duas animações para o fundo da concha nunca raspar no fundo raso.
      // Cada cubo repete seus cantos nas faces: medir apenas os vértices únicos.
      const verticesUnicos = new Map();
      for (const osso of ossos.values()) {
        const pontos = new Map();
        for (let j = 0; j < osso.vertices.length; j += 3) {
          const ponto = Array.from(osso.vertices.subarray(j, j + 3));
          pontos.set(ponto.join(','), ponto);
        }
        verticesUnicos.set(osso.nome, [...pontos.values()]);
      }
      let minimo = Infinity;
      for (let i = 0; i <= 80; i++) {
        const t = i / 40;
        for (const peso of [0, 0.5, 1]) {
          const a = misturarAnimacoes(repousoShellder(t), nadoShellder(t), peso);
          const matrizes = calcularMatrizes(ossos, a, [0, 0, 0], ESCALA_SHELLDER, 0);
          for (const osso of ossos.values()) {
            const m = matrizes.get(osso.nome);
            for (const [x, y, z] of verticesUnicos.get(osso.nome)) {
              minimo = Math.min(minimo, m[1] * x + m[5] * y + m[9] * z + m[13]);
            }
          }
        }
      }
      minimoModelo = minimo;
      atualizarFlutuacao();
    },
    reiniciar,
    atualizar(delta) {
      const dt = Math.max(0, Math.min(delta, 0.05));
      tempo += dt;
      let avancou = false;
      if (ativo && estado === 'idle') {
        espera -= dt;
        if (espera <= 0) {
          espera = 2 + aleatorio() * 3;
          escolherDestino();
        }
      }
      if (ativo && estado === 'swimming') {
        const ultimo = percurso.at(-1);
        tempoPercurso = Math.min(tempoPercurso + dt, ultimo.tempo);
        while (proximo < percurso.length - 1 && percurso[proximo].tempo < tempoPercurso) proximo++;
        const a = percurso[proximo - 1], b = percurso[proximo];
        const t = Math.max(0, Math.min(1, (tempoPercurso - a.tempo) / (b.tempo - a.tempo)));
        posicao[0] = a.x + (b.x - a.x) * t;
        posicao[2] = a.z + (b.z - a.z) * t;
        angulo = a.angulo + (b.angulo - a.angulo) * t;
        avancou = true;
        if (tempoPercurso >= ultimo.tempo) {
          estado = 'idle';
          espera = 2 + aleatorio() * 3;
        }
      }
      mistura += Math.max(-dt * 4, Math.min(dt * 4, (avancou ? 1 : 0) - mistura));
      atualizarFlutuacao();
    },
    animacao() {
      return misturarAnimacoes(repousoShellder(tempo), nadoShellder(tempo), mistura);
    },
  };
}
