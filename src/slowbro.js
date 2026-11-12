import { ALTURA_SUPERFICIE, MEIA_BASE } from './base.js';
import { alturaDeApoio, calcularMatrizes } from './cobblemon.js';
import { criarPercursoSuave } from './personagens.js';
import { misturarAnimacoes } from './animacoes.js';
import { repousoSlowbro, caminhadaSlowbro } from './animacoes-slowbro.js';

export const ESCALA_SLOWBRO = 0.15;
const VELOCIDADE = 0.55;

export function criarPasseioSlowbro(navegacao, aleatorio = Math.random) {
  const posicao = [0, 0, 0];
  let modelo = null, visivel = false, ativo = true, angulo = 0;
  let estado = 'idle', percurso = [], saida = [], proximo = 1, decorrido = 0;
  let espera = Infinity, tempo = 0, passos = 0, mistura = 0;

  function animacao() {
    return misturarAnimacoes(repousoSlowbro(tempo), caminhadaSlowbro(passos), mistura);
  }

  function altura(a, x, z, giro) {
    return ALTURA_SUPERFICIE + alturaDeApoio(modelo, a, x, z, giro,
      navegacao.alturaTerreno, false, ESCALA_SLOWBRO) + 0.01;
  }

  function validarSaida(curva) {
    for (let i = 0; i < curva.length; i += 3) {
      const p = curva[i], a = caminhadaSlowbro(p.tempo);
      const y = altura(a, p.x, p.z, p.angulo);
      const matrizes = calcularMatrizes(modelo, a, [p.x, y, p.z], ESCALA_SLOWBRO, p.angulo);
      for (const osso of modelo.values()) {
        const m = matrizes.get(osso.nome);
        for (let j = 0; j < osso.vertices.length; j += 3) {
          const [x, , z] = osso.vertices.subarray(j, j + 3);
          const vy = osso.vertices[j + 1];
          const px = m[0] * x + m[4] * vy + m[8] * z + m[12];
          const pz = m[2] * x + m[6] * vy + m[10] * z + m[14];
          if (Math.max(Math.abs(px), Math.abs(pz)) >= MEIA_BASE - 0.18) return false;
          if (navegacao.objetos.some(o => Math.hypot(px - o.posicao[0], pz - o.posicao[2]) < o.raio + 0.1)) return false;
        }
      }
    }
    return true;
  }

  function planejar(destino, area) {
    const origem = { x: posicao[0], z: posicao[2] };
    const rota = navegacao.buscarRota(origem, destino, area);
    if (!rota) return null;
    for (const lado of [1, -1]) {
      const curva = criarPercursoSuave(navegacao, origem, angulo, rota, lado,
        { area, velocidade: VELOCIDADE, giroMaximo: 1.7 });
      if (curva && (area !== 'aproximacao' || validarSaida(curva))) return curva;
    }
    return null;
  }

  function iniciar(curva, fase) {
    percurso = curva;
    proximo = 1;
    decorrido = 0;
    estado = fase;
  }

  function escolherDestino() {
    const origem = { x: posicao[0], z: posicao[2] };
    const candidatos = navegacao.alvosAlcancaveis(origem, 'slowbro')
      .filter(p => Math.hypot(p.x - origem.x, p.z - origem.z) > 0.8 && espacoParaCurva(p));
    const inicio = Math.floor(aleatorio() * candidatos.length);
    for (let i = 0; i < candidatos.length; i++) {
      const curva = planejar(candidatos[(inicio + i) % candidatos.length], 'slowbro');
      if (curva) { iniciar(curva, 'wandering'); return; }
    }
  }

  function espacoParaCurva(p) {
    for (let i = 0; i < 8; i++) {
      if (!navegacao.pontoValido({ x: p.x + Math.cos(i * Math.PI / 4) * 0.65,
        z: p.z + Math.sin(i * Math.PI / 4) * 0.65 }, 'slowbro')) return false;
    }
    return true;
  }

  return {
    posicao,
    get visivel() { return visivel; },
    get ativo() { return ativo; },
    get angulo() { return angulo; },
    get estado() { return estado; },
    definirModelo(ossos) { modelo = ossos; },
    revelar(origem, direcao) {
      posicao.splice(0, 3, ...origem);
      angulo = direcao;
      tempo = passos = mistura = 0;
      ativo = true;
      const candidatos = navegacao.grafos.slowbro.nos.filter(espacoParaCurva)
        .sort((a, b) => Math.hypot(a.x - posicao[0], a.z - posicao[2]) - Math.hypot(b.x - posicao[0], b.z - posicao[2]));
      saida = null;
      for (const destino of candidatos) {
        saida = planejar(destino, 'aproximacao');
        if (saida) break;
      }
      if (!saida) throw new Error('Não foi possível preparar a saída do Slowbro da margem.');
      posicao[1] = altura(animacao(), posicao[0], posicao[2], angulo);
      espera = Infinity;
      estado = 'idle';
      visivel = true;
    },
    iniciarPasseio() { espera = 1.5; },
    alternarPasseio() { ativo = !ativo; },
    reiniciar() {
      visivel = false;
      ativo = true;
      estado = 'idle';
      tempo = passos = mistura = decorrido = 0;
      espera = Infinity;
      percurso = saida = [];
    },
    animacao,
    atualizar(delta) {
      if (!visivel || !modelo) return;
      const dt = Math.max(0, Math.min(delta, 0.05));
      tempo += dt;
      let distancia = 0;
      if (ativo && estado === 'idle') {
        espera -= dt;
        if (espera <= 0) {
          espera = 2 + aleatorio() * 3;
          if (saida?.length) { iniciar(saida, 'returning'); saida = []; }
          else escolherDestino();
        }
      }
      if (ativo && estado !== 'idle') {
        decorrido = Math.min(decorrido + dt, percurso.at(-1).tempo);
        while (proximo < percurso.length - 1 && percurso[proximo].tempo < decorrido) proximo++;
        const a = percurso[proximo - 1], b = percurso[proximo];
        const t = Math.max(0, Math.min(1, (decorrido - a.tempo) / (b.tempo - a.tempo)));
        const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
        distancia = Math.hypot(x - posicao[0], z - posicao[2]);
        posicao[0] = x; posicao[2] = z;
        angulo = a.angulo + (b.angulo - a.angulo) * t;
        passos += distancia / VELOCIDADE;
        if (decorrido >= percurso.at(-1).tempo) { estado = 'idle'; espera = 2; }
      }
      mistura += Math.max(-dt * 3, Math.min(dt * 3, (distancia > 0 ? 1 : 0) - mistura));
      posicao[1] = altura(animacao(), posicao[0], posicao[2], angulo);
    },
  };
}
