import { ALTURA_SUPERFICIE } from './base.js';
import { idleSlowpoke, caminhadaSlowpoke, misturarAnimacoes } from './animacoes.js';
import { criarPoses, animacaoDaPose, ajustarCaudaNaAgua } from './poses.js';
import { alturaDeApoio, pontaDaCauda } from './cobblemon.js';

const VELOCIDADE = 0.65;
const GIRO_MAXIMO = 1.35;
const limitar = (valor, minimo, maximo) => Math.max(minimo, Math.min(maximo, valor));
const diferencaAngular = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export function criarPercursoSuave(navegacao, origem, anguloInicial, rota, ladoInicial = 1, opcoes = {}) {
  const area = opcoes.area || 'terra';
  // Remove pontos intermediários que podem ser ligados por um trecho livre.
  const pontos = [origem, ...rota];
  const alvos = [];
  for (let i = 0; i < pontos.length - 1;) {
    let fim = pontos.length - 1;
    if (opcoes.preservarChegada && i < pontos.length - 2) fim--;
    while (fim > i + 1 && !navegacao.trechoValido(pontos[i], pontos[fim], area)) fim--;
    alvos.push(pontos[fim]);
    i = fim;
  }
  if (!alvos.length) return null;

  const passoTempo = 0.06;
  let x = origem.x, z = origem.z, angulo = anguloInicial, giro = 0, tempo = 0, alvo = 0;
  let iniciandoVirada = true;
  const percurso = [{ x, z, angulo, tempo }];
  for (let passo = 0; passo < 2200; passo++) {
    const destino = alvos[alvo];
    const dx = destino.x - x, dz = destino.z - z;
    const distancia = Math.hypot(dx, dz);
    if (distancia < (alvo === alvos.length - 1 ? (opcoes.preservarChegada ? 0.08 : 0.18) : 0.35)) {
      alvo++;
      if (alvo === alvos.length) return percurso.length > 1 ? percurso : null;
      continue;
    }

    let erro = diferencaAngular(Math.atan2(-dx, -dz), angulo);
    // Para uma meia-volta, mantém o lado escolhido até sair da direção oposta.
    if (iniciandoVirada && Math.abs(erro) > Math.PI / 2) erro = Math.abs(erro) * ladoInicial;
    else iniciandoVirada = false;
    const giroDesejado = limitar(erro * 2.8, -GIRO_MAXIMO, GIRO_MAXIMO);
    giro += limitar(giroDesejado - giro, -2.5 * passoTempo, 2.5 * passoTempo);
    const novoAngulo = angulo + giro * passoTempo;
    // Ele desacelera um pouco na curva, mas continua dando passos para a frente.
    let velocidade = VELOCIDADE * (1 - 0.35 * Math.min(Math.abs(erro) / Math.PI, 1));
    if (alvo === alvos.length - 1) velocidade *= Math.min(1, distancia / 0.6);
    const direcao = (angulo + novoAngulo) / 2;
    const novo = { x: x - Math.sin(direcao) * velocidade * passoTempo,
      z: z - Math.cos(direcao) * velocidade * passoTempo };
    if (!navegacao.trechoValido({ x, z }, novo, area)) return null;
    x = novo.x;
    z = novo.z;
    angulo = novoAngulo;
    tempo += passoTempo;
    percurso.push({ x, z, angulo, tempo });
  }
  return null;
}

function completarChegada(navegacao, prefixo, destino, anguloFinal, area) {
  const inicio = prefixo.at(-1);
  const erro = diferencaAngular(anguloFinal, inicio.angulo);
  const voltas = Math.abs(erro) <= Math.PI / 2 ? [0]
    : [erro, erro > 0 ? erro - Math.PI * 2 : erro + Math.PI * 2];
  for (const volta of voltas) {
    for (const raio of volta === 0 ? [0] : [0.32, 0.45, 0.60]) {
      const curva = prefixo.slice();
      let valido = true;
      function adicionar(x, z, angulo) {
        const anterior = curva.at(-1), ponto = { x, z };
        const d = Math.hypot(x - anterior.x, z - anterior.z);
        if (!navegacao.trechoValido(anterior, ponto, area) || d < 0.000001) {
          valido = false;
          return;
        }
        const giro = diferencaAngular(angulo, anterior.angulo);
        curva.push({ x, z, angulo: anterior.angulo + giro,
          tempo: anterior.tempo + Math.max(d / VELOCIDADE, Math.abs(giro) / GIRO_MAXIMO) });
      }
      if (volta !== 0) {
        const sentido = Math.sign(volta);
        const passos = Math.ceil(Math.abs(volta) / 0.05);
        for (let i = 1; i <= passos && valido; i++) {
          const a = inicio.angulo + volta * i / passos;
          adicionar(inicio.x + sentido * raio * (Math.cos(a) - Math.cos(inicio.angulo)),
            inicio.z - sentido * raio * (Math.sin(a) - Math.sin(inicio.angulo)), a);
        }
      }
      if (!valido) continue;
      const a = curva.at(-1);
      const d = Math.hypot(destino.x - a.x, destino.z - a.z);
      const controle = d * 0.42;
      const b = { x: a.x - Math.sin(a.angulo) * controle, z: a.z - Math.cos(a.angulo) * controle };
      const c = { x: destino.x + Math.sin(anguloFinal) * controle,
        z: destino.z + Math.cos(anguloFinal) * controle };
      // Bézier cúbica: a direção do corpo coincide com a tangente na chegada.
      const passos = Math.max(24, Math.ceil(d / 0.035));
      for (let i = 1; i <= passos && valido; i++) {
        const t = i / passos, s = 1 - t;
        const x = s ** 3 * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t ** 3 * destino.x;
        const z = s ** 3 * a.z + 3 * s * s * t * b.z + 3 * s * t * t * c.z + t ** 3 * destino.z;
        const dx = 3 * s * s * (b.x - a.x) + 6 * s * t * (c.x - b.x) + 3 * t * t * (destino.x - c.x);
        const dz = 3 * s * s * (b.z - a.z) + 6 * s * t * (c.z - b.z) + 3 * t * t * (destino.z - c.z);
        adicionar(x, z, Math.atan2(-dx, -dz));
      }
      if (valido) return curva;
    }
  }
  return null;
}

export function criarPasseioSlowpoke(navegacao, inicio, aleatorio = Math.random) {
  const posicao = [...inicio];
  const poses = criarPoses();
  let modelo = null;
  let angulo = Math.PI, ativo = true, estado = 'idle';
  let percurso = [], proximo = 1, tempoPercurso = 0, espera = 3;
  let tempoRepouso = 0, tempoCaminhada = 0, mistura = 0;
  let indicePose = -1, pedidoPose = null, poseFixa = null, transicao = null;
  let modoPose = 'andar';
  const pontoAtual = () => ({ x: posicao[0], z: posicao[2] });
  const distancia = (a, b) => Math.hypot(b.x - a.x, b.z - a.z);
  const suave = t => t * t * (3 - 2 * t);

  if (!navegacao.pontoValido(pontoAtual())) throw new Error('Posição inicial do Slowpoke sem espaço para caminhar.');

  function animacaoAtual() {
    const padrao = misturarAnimacoes(idleSlowpoke(tempoRepouso), caminhadaSlowpoke(tempoCaminhada), mistura);
    if (transicao) {
      const alvo = transicao.pose === null ? idleSlowpoke(tempoRepouso)
        : animacaoDaPose(transicao.pose, tempoRepouso, poses[transicao.pose].inclinacaoCauda);
      return misturarAnimacoes(transicao.origem, alvo, suave(transicao.tempo / transicao.duracao));
    }
    return poseFixa === null ? padrao
      : animacaoDaPose(poseFixa, tempoRepouso, poses[poseFixa].inclinacaoCauda);
  }

  function iniciarPercurso(curva, novoEstado) {
    percurso = curva;
    proximo = 1;
    tempoPercurso = 0;
    estado = novoEstado;
  }

  function planejar(destino, area = 'terra', anguloFinal = null) {
    const origem = pontoAtual();
    const entradas = anguloFinal === null ? [null] : [1.8, 2.4, 1.2, 0.8, 3.0];
    for (const entrada of entradas) {
      const pontoEntrada = entrada === null ? destino
        : { x: destino.x + Math.sin(anguloFinal) * entrada,
          z: destino.z + Math.cos(anguloFinal) * entrada };
      if (!navegacao.pontoValido(pontoEntrada, area)
        || !navegacao.trechoValido(pontoEntrada, destino, area)) continue;
      const caminho = navegacao.buscarRota(origem, pontoEntrada, area);
      if (!caminho?.length) continue;
      const erro = diferencaAngular(Math.atan2(origem.x - caminho[0].x, origem.z - caminho[0].z), angulo);
      const lado = erro >= 0 ? 1 : -1;
      for (const sentido of [lado, -lado]) {
        let curva = criarPercursoSuave(navegacao, origem, angulo, caminho, sentido,
          { area, preservarChegada: entrada !== null });
        if (!curva) continue;
        if (anguloFinal !== null) curva = completarChegada(navegacao, curva, destino, anguloFinal, area);
        if (!curva) continue;
        return curva;
      }
    }
    return null;
  }

  function temEspacoParaCurva(no) {
    for (let i = 0; i < 8; i++) {
      if (!navegacao.pontoValido({ x: no.x + Math.cos(i * Math.PI / 4) * 0.65,
        z: no.z + Math.sin(i * Math.PI / 4) * 0.65 })) return false;
    }
    return true;
  }

  function escolherDestino() {
    const origem = pontoAtual();
    const candidatos = navegacao.alvosAlcancaveis(origem).filter(no =>
      distancia(origem, no) >= 3 && distancia(origem, no) <= 9 && temEspacoParaCurva(no));
    if (!candidatos.length) return;
    const primeiro = Math.min(candidatos.length - 1, Math.floor(aleatorio() * candidatos.length));
    for (let i = 0; i < Math.min(candidatos.length, 12); i++) {
      const curva = planejar(candidatos[(primeiro + i) % candidatos.length]);
      if (curva) {
        iniciarPercurso(curva, 'wandering');
        return;
      }
    }
  }

  function aproximarDaPose() {
    if (pedidoPose === null) return;
    const pose = poses[pedidoPose];
    const curva = planejar(pose, 'aproximacao', pose.angulo);
    if (!curva) throw new Error(`Não foi possível calcular a chegada à pose ${pedidoPose + 1}.`);
    iniciarPercurso(curva, 'movingToPose');
  }

  function retomarPasseio() {
    ativo = true;
    pedidoPose = null;
    if (navegacao.pontoValido(pontoAtual())) {
      estado = 'idle';
      espera = 0.3;
      return;
    }
    // Sai da margem pelo mesmo terreno válido antes de retomar o passeio livre.
    const candidatos = navegacao.alvosAlcancaveis({ x: inicio[0], z: inicio[2] })
      .filter(temEspacoParaCurva).sort((a, b) => distancia(pontoAtual(), a) - distancia(pontoAtual(), b));
    for (const destino of candidatos) {
      const curva = planejar(destino, 'aproximacao');
      if (curva) {
        iniciarPercurso(curva, 'returning');
        return;
      }
    }
    throw new Error('Não foi possível calcular o retorno da margem.');
  }

  function sairDaPose() {
    const origem = animacaoAtual();
    transicao = { origem, pose: null, tempo: 0, duracao: 0.85 };
    poseFixa = null;
    estado = 'leavingPose';
    mistura = 0;
  }

  function atualizarApoio() {
    if (!modelo || estado === 'wandering' || estado === 'idle') return;
    const permitirCaudaNaAgua = poseFixa === 3 || transicao?.pose === 3;
    posicao[1] = ALTURA_SUPERFICIE + alturaDeApoio(modelo, animacaoAtual(),
      posicao[0], posicao[2], angulo, navegacao.alturaTerreno, permitirCaudaNaAgua) + 0.01;
  }

  function mostrarPoseImediata(indice) {
    const pose = poses[indice];
    pedidoPose = indice;
    poseFixa = indice;
    transicao = null;
    percurso = [];
    proximo = 1;
    tempoPercurso = 0;
    tempoRepouso = 0;
    mistura = 0;
    ativo = false;
    estado = 'posing';
    posicao[0] = pose.x;
    posicao[2] = pose.z;
    angulo = pose.angulo;
    atualizarApoio();
  }

  function proximaPose() {
    indicePose = (indicePose + 1) % poses.length;
    pedidoPose = indicePose;
    ativo = false;
    if (modoPose === 'instantaneo') {
      mostrarPoseImediata(indicePose);
      return;
    }
    if (poseFixa !== null || transicao) sairDaPose();
    else aproximarDaPose();
  }

  function alternarPasseio() {
    if (pedidoPose !== null || poseFixa !== null || transicao || estado === 'movingToPose') {
      pedidoPose = null;
      ativo = true;
      if (poseFixa !== null || transicao) sairDaPose();
      else retomarPasseio();
      return;
    }
    ativo = !ativo;
  }

  function reiniciar() {
    posicao.splice(0, 3, ...inicio);
    angulo = Math.PI;
    ativo = true;
    estado = 'idle';
    percurso = [];
    proximo = 1;
    tempoPercurso = 0;
    espera = 3;
    tempoRepouso = 0;
    tempoCaminhada = 0;
    mistura = 0;
    indicePose = -1;
    pedidoPose = null;
    poseFixa = null;
    transicao = null;
  }

  function atualizarPercurso(dt) {
    const antesX = posicao[0], antesZ = posicao[2];
    const ultimo = percurso[percurso.length - 1];
    tempoPercurso = Math.min(tempoPercurso + dt, ultimo.tempo);
    while (proximo < percurso.length - 1 && percurso[proximo].tempo < tempoPercurso) proximo++;
    const a = percurso[proximo - 1], b = percurso[proximo];
    const t = limitar((tempoPercurso - a.tempo) / (b.tempo - a.tempo), 0, 1);
    posicao[0] = a.x + (b.x - a.x) * t;
    posicao[2] = a.z + (b.z - a.z) * t;
    angulo = a.angulo + (b.angulo - a.angulo) * t;
    posicao[1] = ALTURA_SUPERFICIE + navegacao.alturaTerreno(posicao[0], posicao[2]) + 0.01;
    const avancou = Math.hypot(posicao[0] - antesX, posicao[2] - antesZ);
    tempoCaminhada += avancou / VELOCIDADE;
    if (tempoPercurso >= ultimo.tempo) {
      if (estado === 'movingToPose') {
        const origem = animacaoAtual();
        transicao = { origem, pose: pedidoPose, tempo: 0, duracao: 1.2,
          posicao: [...posicao], angulo };
        estado = 'posing';
        mistura = 0;
      } else {
        estado = 'idle';
        espera = 2 + aleatorio() * 3;
      }
    }
    return avancou;
  }

  return {
    posicao,
    get angulo() { return angulo; },
    get ativo() { return ativo; },
    get estado() { return estado; },
    get indicePose() { return indicePose; },
    get modoPose() { return modoPose; },
    get poseConcluida() { return estado === 'posing' && !transicao ? poseFixa : null; },
    definirModelo(ossos) {
      modelo = ossos;
      ajustarCaudaNaAgua(poses[3], modelo, navegacao.alturaTerreno);
    },
    definirModoPose(modo) {
      if (modo !== 'andar' && modo !== 'instantaneo') return;
      modoPose = modo;
      if (modoPose === 'instantaneo' && pedidoPose !== null) mostrarPoseImediata(pedidoPose);
    },
    pontaCauda() {
      return modelo ? pontaDaCauda(modelo, animacaoAtual(), posicao, angulo) : null;
    },
    proximaPose, alternarPasseio, reiniciar,
    atualizar(delta) {
      const dt = Math.max(0, Math.min(delta, 0.05));
      tempoRepouso += dt;
      let avancou = 0;
      if (transicao) {
        transicao.tempo = Math.min(transicao.tempo + dt, transicao.duracao);
        if (transicao.pose !== null) {
          const pose = poses[transicao.pose], t = suave(transicao.tempo / transicao.duracao);
          posicao[0] = transicao.posicao[0] + (pose.x - transicao.posicao[0]) * t;
          posicao[2] = transicao.posicao[2] + (pose.z - transicao.posicao[2]) * t;
          angulo = transicao.angulo + diferencaAngular(pose.angulo, transicao.angulo) * t;
        }
        if (transicao.tempo >= transicao.duracao) {
          poseFixa = transicao.pose;
          transicao = null;
          if (poseFixa === null) {
            if (pedidoPose !== null) aproximarDaPose();
            else retomarPasseio();
          }
        }
      } else if (estado === 'movingToPose' || (ativo && ['wandering', 'returning'].includes(estado))) {
        avancou = atualizarPercurso(dt);
      } else if (ativo && estado === 'idle') {
        espera -= dt;
        if (espera <= 0) {
          espera = 2 + aleatorio() * 3;
          escolherDestino();
        }
      }
      const alvoMistura = avancou > 0 ? 1 : 0;
      mistura += limitar(alvoMistura - mistura, -dt * 4, dt * 4);
      atualizarApoio();
    },
    animacao: animacaoAtual,
  };
}
