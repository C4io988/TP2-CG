import { MEIA_BASE } from './base.js';

const distancia = (a, b) => Math.hypot(b.x - a.x, b.z - a.z);

export function criarNavegacao(alturaTerreno, objetos, raioTerra = 3.25) {
  const passo = 1.2;
  const limite = MEIA_BASE - 0.18;
  // O corpo e a cauda precisam caber mesmo durante uma curva.
  const margens = { terra: raioTerra, agua: 0.8 };

  function pontoValido(ponto, area = 'terra') {
    const margem = margens[area];
    if (margem === undefined) throw new Error(`Área de navegação desconhecida: ${area}`);
    if (Math.abs(ponto.x) + margem >= limite || Math.abs(ponto.z) + margem >= limite) return false;
    const altura = alturaTerreno(ponto.x, ponto.z);
    if (area === 'terra') {
      if (altura <= 0) return false;
      for (const objeto of objetos) {
        if (Math.hypot(ponto.x - objeto.posicao[0], ponto.z - objeto.posicao[2])
          < margem + objeto.raio + 0.15) return false;
      }
    } else if (altura > 0) return false;

    for (const fator of [0.5, 1]) {
      for (let i = 0; i < 16; i++) {
        const angulo = i * Math.PI / 8;
        const amostra = alturaTerreno(ponto.x + Math.cos(angulo) * margem * fator,
          ponto.z + Math.sin(angulo) * margem * fator);
        // Nesta etapa o passeio usa patamares planos: não atravessa os degraus
        // com as patas flutuando ou enterradas. A margem fica para as futuras poses.
        if (area === 'terra' ? Math.abs(amostra - altura) > 0.01 : amostra > 0) return false;
      }
    }
    return true;
  }

  function trechoValido(inicio, fim, area = 'terra') {
    const amostras = Math.max(1, Math.ceil(distancia(inicio, fim) / 0.2));
    for (let i = 0; i <= amostras; i++) {
      const t = i / amostras;
      if (!pontoValido({ x: inicio.x + (fim.x - inicio.x) * t,
        z: inicio.z + (fim.z - inicio.z) * t }, area)) return false;
    }
    return true;
  }

  function criarGrafo(area) {
    const nos = [], grade = new Map();
    const alcance = Math.floor(limite / passo);
    for (let j = -alcance; j <= alcance; j++) {
      for (let i = -alcance; i <= alcance; i++) {
        const ponto = { x: i * passo, z: j * passo };
        if (!pontoValido(ponto, area)) continue;
        const no = { ...ponto, vizinhos: [], componente: -1 };
        nos.push(no);
        grade.set(`${i},${j}`, no);
      }
    }
    for (let j = -alcance; j <= alcance; j++) {
      for (let i = -alcance; i <= alcance; i++) {
        const no = grade.get(`${i},${j}`);
        if (!no) continue;
        for (const [di, dj] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
          const vizinho = grade.get(`${i + di},${j + dj}`);
          if (!vizinho || !trechoValido(no, vizinho, area)) continue;
          no.vizinhos.push(vizinho);
          vizinho.vizinhos.push(no);
        }
      }
    }
    let componente = 0;
    for (const no of nos) {
      if (no.componente !== -1) continue;
      const fila = [no];
      no.componente = componente;
      for (let i = 0; i < fila.length; i++) {
        for (const vizinho of fila[i].vizinhos) {
          if (vizinho.componente !== -1) continue;
          vizinho.componente = componente;
          fila.push(vizinho);
        }
      }
      componente++;
    }
    return { area, nos };
  }

  const grafos = { terra: criarGrafo('terra'), agua: criarGrafo('agua') };

  function conexoes(ponto, area) {
    return grafos[area].nos.slice().sort((a, b) => distancia(ponto, a) - distancia(ponto, b))
      .slice(0, 24).filter(no => trechoValido(ponto, no, area)).slice(0, 6);
  }

  function alvosAlcancaveis(inicio, area = 'terra') {
    const componentes = new Set(conexoes(inicio, area).map(no => no.componente));
    return grafos[area].nos.filter(no => componentes.has(no.componente));
  }

  function buscarRota(inicio, destino, area = 'terra') {
    if (!pontoValido(inicio, area) || !pontoValido(destino, area)) return null;
    if (trechoValido(inicio, destino, area)) return [{ x: destino.x, z: destino.z }];
    const origens = conexoes(inicio, area), finais = new Set(conexoes(destino, area));
    if (!origens.length || !finais.size) return null;
    const abertos = new Set(origens), anterior = new Map();
    const custos = new Map(origens.map(no => [no, distancia(inicio, no)]));
    while (abertos.size) {
      let atual = null;
      for (const no of abertos) {
        if (!atual || custos.get(no) + distancia(no, destino)
          < custos.get(atual) + distancia(atual, destino)) atual = no;
      }
      abertos.delete(atual);
      if (finais.has(atual)) {
        const rota = [{ x: destino.x, z: destino.z }];
        for (let no = atual; no; no = anterior.get(no)) rota.unshift({ x: no.x, z: no.z });
        return rota;
      }
      for (const vizinho of atual.vizinhos) {
        const custo = custos.get(atual) + distancia(atual, vizinho);
        if (custo >= (custos.get(vizinho) ?? Infinity)) continue;
        custos.set(vizinho, custo);
        anterior.set(vizinho, atual);
        abertos.add(vizinho);
      }
    }
    return null;
  }

  return { grafos, alturaTerreno, pontoValido, trechoValido, alvosAlcancaveis, buscarRota };
}
