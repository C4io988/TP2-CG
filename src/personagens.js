import { ALTURA_SUPERFICIE } from './base.js';
import { idleSlowpoke, caminhadaSlowpoke, misturarAnimacoes } from './animacoes.js';

const VELOCIDADE = 0.65;
const GIRO_MAXIMO = 1.35;
const limitar = (valor, minimo, maximo) => Math.max(minimo, Math.min(maximo, valor));
const diferencaAngular = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export function criarPercursoSuave(navegacao, origem, anguloInicial, rota, ladoInicial = 1) {
  // Remove pontos intermediários que podem ser ligados por um trecho livre.
  const pontos = [origem, ...rota];
  const alvos = [];
  for (let i = 0; i < pontos.length - 1;) {
    let fim = pontos.length - 1;
    while (fim > i + 1 && !navegacao.trechoValido(pontos[i], pontos[fim])) fim--;
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
    if (distancia < (alvo === alvos.length - 1 ? 0.18 : 0.35)) {
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
    if (!navegacao.trechoValido({ x, z }, novo)) return null;
    x = novo.x;
    z = novo.z;
    angulo = novoAngulo;
    tempo += passoTempo;
    percurso.push({ x, z, angulo, tempo });
  }
  return null;
}

export function criarPasseioSlowpoke(navegacao, inicio, aleatorio = Math.random) {
  const posicao = [...inicio];
  let angulo = Math.PI, ativo = true, estado = 'idle';
  let percurso = [], proximo = 1, tempoPercurso = 0, espera = 3;
  let tempoRepouso = 0, tempoCaminhada = 0, mistura = 0;
  const pontoAtual = () => ({ x: posicao[0], z: posicao[2] });

  if (!navegacao.pontoValido(pontoAtual())) throw new Error('Posição inicial do Slowpoke sem espaço para caminhar.');

  function escolherDestino() {
    const origem = pontoAtual();
    const candidatos = navegacao.alvosAlcancaveis(origem).filter(no => {
      const distancia = Math.hypot(no.x - origem.x, no.z - origem.z);
      if (distancia < 3 || distancia > 9) return false;
      // Reserva espaço no destino para a próxima curva de saída.
      for (let i = 0; i < 8; i++) {
        if (!navegacao.pontoValido({ x: no.x + Math.cos(i * Math.PI / 4) * 0.65,
          z: no.z + Math.sin(i * Math.PI / 4) * 0.65 })) return false;
      }
      return true;
    });
    if (!candidatos.length) return;
    const primeiro = Math.min(candidatos.length - 1, Math.floor(aleatorio() * candidatos.length));
    for (let tentativa = 0; tentativa < Math.min(candidatos.length, 12); tentativa++) {
      const destino = candidatos[(primeiro + tentativa) % candidatos.length];
      const caminho = navegacao.buscarRota(origem, destino);
      if (!caminho?.length) continue;
      const erroInicial = diferencaAngular(Math.atan2(origem.x - caminho[0].x, origem.z - caminho[0].z), angulo);
      const lado = erroInicial >= 0 ? 1 : -1;
      const curva = criarPercursoSuave(navegacao, origem, angulo, caminho, lado)
        || criarPercursoSuave(navegacao, origem, angulo, caminho, -lado);
      if (!curva) continue;
      percurso = curva;
      proximo = 1;
      tempoPercurso = 0;
      estado = 'wandering';
      return;
    }
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
  }

  return {
    posicao,
    get angulo() { return angulo; },
    get ativo() { return ativo; },
    get estado() { return estado; },
    alternarPasseio() { ativo = !ativo; },
    reiniciar,
    atualizar(delta) {
      const dt = Math.max(0, Math.min(delta, 0.05));
      tempoRepouso += dt;
      let avancou = 0;
      if (ativo && estado === 'idle') {
        espera -= dt;
        if (espera <= 0) {
          espera = 2 + aleatorio() * 3;
          escolherDestino();
        }
      }
      if (ativo && estado === 'wandering') {
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
        avancou = Math.hypot(posicao[0] - antesX, posicao[2] - antesZ);
        tempoCaminhada += avancou / VELOCIDADE;
        if (tempoPercurso >= ultimo.tempo) {
          estado = 'idle';
          espera = 2 + aleatorio() * 3;
        }
      }
      const alvoMistura = avancou > 0 ? 1 : 0;
      mistura += Math.max(-dt * 4, Math.min(dt * 4, alvoMistura - mistura));
    },
    animacao() {
      return misturarAnimacoes(idleSlowpoke(tempoRepouso), caminhadaSlowpoke(tempoCaminhada), mistura);
    },
  };
}
