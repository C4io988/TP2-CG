import { m4 } from '../vendor/twgl-full.module.js';
import { ALTURA_SUPERFICIE, MEIA_BASE } from './base.js';
import { calcularMatrizes } from './cobblemon.js';
import { criarPercursoSuave, completarChegada } from './personagens.js';
import { ESCALA_SHELLDER } from './shellder.js';
import { nadoShellder, mordidaShellder, misturarAnimacoes } from './animacoes.js';

const suave = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

export function criarInteracaoCauda(slowpoke, shellder, navegacao, profundidadeAgua) {
  let estado = 'inactive', tempo = 0, espera = 0, fechamento = 0;
  let ossos = null, vertices = [], trajeto = [], historico = [];
  let decorrido = 0, proximo = 1, anguloContato = 0, animacaoInicial = null;
  let retorno = 0, animacaoRetorno = null;

  function posicaoContato(ponta, angulo) {
    const matriz = calcularMatrizes(ossos, mordidaShellder(0), [0, 0, 0], ESCALA_SHELLDER, angulo);
    const abertura = m4.transformPoint(matriz.get('body'), [0, 0.5, -6.5]);
    return Array.from(ponta, (valor, i) => valor - abertura[i]);
  }

  function animacaoChegada(peso, t) {
    return misturarAnimacoes(nadoShellder(t), mordidaShellder(t), peso);
  }

  function geometriaValida(posicao, angulo, animacao) {
    const matrizes = calcularMatrizes(ossos, animacao, posicao, ESCALA_SHELLDER, angulo);
    for (const [nome, pontos] of vertices) {
      const m = matrizes.get(nome);
      for (const [x, y, z] of pontos) {
        const px = m[0] * x + m[4] * y + m[8] * z + m[12];
        const py = m[1] * x + m[5] * y + m[9] * z + m[13];
        const pz = m[2] * x + m[6] * y + m[10] * z + m[14];
        if (Math.max(Math.abs(px), Math.abs(pz)) >= MEIA_BASE - 0.18) return false;
        const areia = navegacao.alturaTerreno(px, pz);
        const chao = areia > 0 ? areia : -profundidadeAgua(px, pz);
        if (py < ALTURA_SUPERFICIE + chao + 0.02) return false;
      }
    }
    return true;
  }

  function planejar() {
    const ponta = slowpoke.pontoMordida();
    const origem = { x: shellder.posicao[0], z: shellder.posicao[2] };
    // Chega pela lateral marítima: a abertura aponta para a parte branca da cauda.
    for (const angulo of [1.47, 1.50, 1.44, 1.42, Math.PI / 2]) {
      const contato = posicaoContato(ponta, angulo);
      const destino = { x: contato[0], z: contato[2] };
      if (!navegacao.pontoValido(destino, 'mordida')) continue;
      if (![0, 0.5, 1].every(p => geometriaValida(contato, angulo, mordidaShellder(0, p)))) continue;
      for (const recuo of [1.2, 0]) for (const distancia of [2.8, 2, 1.2, 0.9, 0.6, 3.6]) {
        const entrada = { x: destino.x + Math.sin(angulo) * distancia,
          z: destino.z + Math.cos(angulo) * distancia - recuo };
        const rota = navegacao.buscarRota(origem, entrada, 'mordida');
        if (!rota) continue;
        for (const lado of [1, -1]) {
          let curva = criarPercursoSuave(navegacao, origem, shellder.angulo, rota, lado,
            { area: 'mordida', preservarChegada: true, velocidade: 0.9, giroMaximo: 1.7 });
          if (!curva) continue;
          curva = completarChegada(navegacao, curva, destino, angulo, 'mordida');
          if (!curva) continue;
          const duracao = curva.at(-1).tempo;
          for (const ponto of curva) {
            ponto.peso = suave(1 - (duracao - ponto.tempo) / 4);
          }
          // A margem circular menor permite alinhar a concha na faixa estreita;
          // os vértices reais conferem também língua, chifres e fundo do mar.
          const valida = curva.every((p, i) => {
            if (i % 3 !== 0 && i !== curva.length - 1) return true;
            const y = shellder.alturaNaAgua(p.x, p.z) * (1 - p.peso) + contato[1] * p.peso;
            return geometriaValida([p.x, y, p.z], p.angulo, animacaoChegada(p.peso, p.tempo));
          });
          if (!valida) continue;
          trajeto = curva;
          anguloContato = angulo;
          decorrido = 0;
          proximo = 1;
          historico = [{ posicao: [...shellder.posicao], angulo: shellder.angulo, tempo: 0,
            animacao: shellder.animacao() }];
          animacaoInicial = shellder.animacao();
          estado = 'approaching';
          return true;
        }
      }
    }
    return false;
  }

  function cancelar() {
    espera = 0;
    if (['approaching', 'biting', 'attached'].includes(estado)) {
      retorno = historico.at(-1).tempo;
      animacaoRetorno = shellder.animacao();
      estado = 'returning';
    } else if (estado !== 'returning') estado = 'inactive';
  }

  function reiniciar() {
    estado = 'inactive';
    tempo = 0;
    decorrido = 0;
    retorno = 0;
    proximo = 1;
    espera = 0;
    fechamento = 0;
    trajeto = [];
    historico = [];
    shellder.liberarControle();
  }

  return {
    get estado() { return estado; },
    get bloqueada() { return estado === 'biting'; },
    definirModelo(modelo) {
      ossos = modelo;
      vertices = [...ossos.values()].map(osso => {
        const unicos = new Map();
        for (let i = 0; i < osso.vertices.length; i += 3) {
          const p = Array.from(osso.vertices.subarray(i, i + 3));
          unicos.set(p.join(','), p);
        }
        return [osso.nome, [...unicos.values()]];
      });
    },
    cancelar, reiniciar,
    atualizar(delta, pronto = true) {
      if (!pronto || !ossos) return;
      const dt = Math.max(0, Math.min(delta, 0.05));
      tempo += dt;
      if (estado === 'returning') {
        retorno = Math.max(0, retorno - dt * 1.3);
        while (historico.length > 1 && historico.at(-1).tempo > retorno) historico.pop();
        const p = historico.at(-1);
        const atual = shellder.posicao;
        // Recuo sobre o trajeto já percorrido, sem saltar para um nó do grafo.
        const peso = Math.min(1, dt * 60 * 0.7);
        const giro = Math.atan2(Math.sin(p.angulo - shellder.angulo), Math.cos(p.angulo - shellder.angulo));
        shellder.controlar(atual.map((v, i) => v + (p.posicao[i] - v) * peso),
          shellder.angulo + giro * peso,
          misturarAnimacoes(animacaoRetorno, p.animacao, suave(1 - retorno / Math.max(0.001, decorrido))));
        if (retorno === 0) {
          shellder.controlar(p.posicao, p.angulo, p.animacao);
          shellder.liberarControle();
          estado = 'inactive';
        }
        return;
      }
      if (slowpoke.poseConcluida !== 3) { cancelar(); return; }
      if (estado === 'inactive') { estado = 'waiting'; espera = 0; }
      if (estado === 'waiting') {
        espera += dt;
        if (espera >= 5 && !planejar()) espera = 3;
        return;
      }
      if (estado === 'approaching') {
        decorrido = Math.min(decorrido + dt, trajeto.at(-1).tempo);
        while (proximo < trajeto.length - 1 && trajeto[proximo].tempo < decorrido) proximo++;
        const a = trajeto[proximo - 1], b = trajeto[proximo];
        const t = Math.max(0, Math.min(1, (decorrido - a.tempo) / (b.tempo - a.tempo)));
        const peso = a.peso + (b.peso - a.peso) * t;
        const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
        const contato = posicaoContato(slowpoke.pontoMordida(), anguloContato);
        const y = shellder.alturaNaAgua(x, z) * (1 - peso) + contato[1] * peso;
        const animacao = misturarAnimacoes(animacaoInicial, animacaoChegada(peso, tempo), suave(decorrido / 0.5));
        shellder.controlar([x, y, z], a.angulo + (b.angulo - a.angulo) * t, animacao);
        historico.push({ posicao: [...shellder.posicao], angulo: shellder.angulo, tempo: decorrido, animacao });
        if (decorrido >= trajeto.at(-1).tempo) {
          estado = 'biting';
          fechamento = 0;
          slowpoke.reagirAMordida();
        }
        return;
      }
      if (estado === 'biting' || estado === 'attached') {
        fechamento = Math.min(1, fechamento + dt / 0.9);
        shellder.controlar(posicaoContato(slowpoke.pontoMordida(), anguloContato),
          anguloContato, mordidaShellder(tempo, suave(fechamento)));
        if (fechamento === 1) estado = 'attached';
      }
    },
  };
}
