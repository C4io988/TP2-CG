// O eixo local X aponta para o mar, na direção da câmera inicial.
const AZIMUTE_PRAIA = 0.35;
const SENO = Math.sin(AZIMUTE_PRAIA);
const COSSENO = Math.cos(AZIMUTE_PRAIA);

export function posicaoNaPraia(distancia, lateral = 0) {
  return [SENO * distancia - COSSENO * lateral,
    COSSENO * distancia + SENO * lateral];
}

export function criarGeometriaPraia(meiaLargura, divisoes = 64) {
  const tamanhoBloco = meiaLargura * 2 / divisoes;
  const alturaDegrau = 0.22;
  const suave = valor => {
    const t = Math.max(0, Math.min(1, valor));
    return t * t * (3 - 2 * t);
  };

  function limiteAreia(angulo) {
    const formato = 0.72
      + Math.sin(angulo * 3 + 0.5) * 0.13
      + Math.cos(angulo * 5 - 0.3) * 0.075
      + Math.sin(angulo * 2 + 0.8) * 0.035;
    const distanciaAtras = Math.acos(Math.max(-1, Math.min(1, -Math.cos(angulo))));
    const ligacao = 1 - suave((distanciaAtras - 0.25) / 0.65);
    const [dx, dz] = posicaoNaPraia(Math.cos(angulo), Math.sin(angulo));
    const bordaQuadrada = meiaLargura / Math.max(Math.abs(dx), Math.abs(dz));
    // Recuo suave da margem frontal abre uma enseada dentro do casco circular.
    const enseada = 2.3 * Math.exp(-Math.pow((angulo + 0.12) / 0.48, 2));
    return bordaQuadrada * (formato + 0.5 * ligacao) - enseada;
  }

  // Cada célula é um bloco plano. A mesma altura serve ao desenho e ao personagem.
  const alturas = new Float32Array(divisoes * divisoes);
  for (let linha = 0; linha < divisoes; linha++) {
    for (let coluna = 0; coluna < divisoes; coluna++) {
      const x = -meiaLargura + (coluna + 0.5) * tamanhoBloco;
      const z = -meiaLargura + (linha + 0.5) * tamanhoBloco;
      const localX = SENO * x + COSSENO * z;
      const localZ = -COSSENO * x + SENO * z;
      const distanciaMargem = limiteAreia(Math.atan2(localZ, localX)) - Math.hypot(localX, localZ);
      if (distanciaMargem <= 0) continue;
      const altura = 1.1 * suave(distanciaMargem / 4);
      alturas[linha * divisoes + coluna] = Math.max(alturaDegrau,
        Math.ceil((altura - 0.000001) / alturaDegrau) * alturaDegrau);
    }
  }

  function alturaCelula(coluna, linha) {
    if (coluna < 0 || coluna >= divisoes || linha < 0 || linha >= divisoes) return 0;
    return alturas[linha * divisoes + coluna];
  }
  function alturaTerreno(x, z) {
    if (Math.hypot(x, z) > meiaLargura) return 0;
    return alturaCelula(Math.floor((x + meiaLargura) / tamanhoBloco),
      Math.floor((z + meiaLargura) / tamanhoBloco));
  }

  // Distância em células até a areia: o fundo aprofunda em pequenos degraus.
  const distancias = new Int16Array(divisoes * divisoes).fill(-1);
  const fila = [];
  for (let linha = 0; linha < divisoes; linha++) {
    for (let coluna = 0; coluna < divisoes; coluna++) {
      if (alturaCelula(coluna, linha) > 0) {
        const indice = linha * divisoes + coluna;
        distancias[indice] = 0;
        fila.push(indice);
      }
    }
  }
  for (let i = 0; i < fila.length; i++) {
    const atual = fila[i], coluna = atual % divisoes, linha = Math.floor(atual / divisoes);
    for (const [dc, dl] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = coluna + dc, l = linha + dl;
      if (c < 0 || c >= divisoes || l < 0 || l >= divisoes) continue;
      const vizinho = l * divisoes + c;
      if (distancias[vizinho] !== -1) continue;
      distancias[vizinho] = distancias[atual] + 1;
      fila.push(vizinho);
    }
  }
  function profundidadeCelula(coluna, linha) {
    const c = Math.max(0, Math.min(divisoes - 1, coluna));
    const l = Math.max(0, Math.min(divisoes - 1, linha));
    return 0.60 + Math.min(6, Math.max(0, distancias[l * divisoes + c] - 1)) * 0.18;
  }
  function profundidadeVertice(x, z) {
    const c = Math.round((x + meiaLargura) / tamanhoBloco);
    const l = Math.round((z + meiaLargura) / tamanhoBloco);
    return (profundidadeCelula(c - 1, l - 1) + profundidadeCelula(c, l - 1)
      + profundidadeCelula(c - 1, l) + profundidadeCelula(c, l)) / 4;
  }

  function menorProfundidade(x, z, raio) {
    const coluna = valor => Math.floor((valor + meiaLargura) / tamanhoBloco);
    let profundidade = Infinity;
    for (let l = coluna(z - raio); l <= coluna(z + raio); l++) {
      for (let c = coluna(x - raio); c <= coluna(x + raio); c++) {
        profundidade = Math.min(profundidade, profundidadeCelula(c, l));
      }
    }
    return profundidade;
  }

  function profundidadeAgua(x, z, raio = 0) {
    if (raio === 0) return menorProfundidade(x, z, 0);
    // Interpola áreas um bloco maiores: a altura varia suavemente, sempre com
    // uma estimativa conservadora do fundo sob toda a geometria animada.
    const coluna = Math.floor((x + meiaLargura) / tamanhoBloco);
    const linha = Math.floor((z + meiaLargura) / tamanhoBloco);
    const x0 = coluna * tamanhoBloco - meiaLargura;
    const z0 = linha * tamanhoBloco - meiaLargura;
    const tx = (x - x0) / tamanhoBloco, tz = (z - z0) / tamanhoBloco;
    const margem = raio + tamanhoBloco;
    const a = menorProfundidade(x0, z0, margem);
    const b = menorProfundidade(x0 + tamanhoBloco, z0, margem);
    const c = menorProfundidade(x0, z0 + tamanhoBloco, margem);
    const d = menorProfundidade(x0 + tamanhoBloco, z0 + tamanhoBloco, margem);
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  }

  const malha = () => ({ position: [], normal: [], texcoord: [], indices: [] });
  const areia = malha(), agua = malha(), lateral = malha(), fundo = malha();
  agua.depth = { numComponents: 1, data: [] };
  // Recorta as células contra um círculo de 128 segmentos, preservando os
  // degraus internos e uma borda lisa comum à areia, à água e ao fundo.
  const segmentos = 128;
  const apotema = meiaLargura * Math.cos(Math.PI / segmentos);
  function recortar(pontos) {
    if (pontos.every(([x, , z]) => Math.hypot(x, z) <= apotema)) return pontos;
    for (let i = 0; i < segmentos && pontos.length; i++) {
      const angulo = (i + 0.5) * Math.PI * 2 / segmentos;
      const nx = Math.cos(angulo), nz = Math.sin(angulo);
      const saida = [];
      for (let j = 0; j < pontos.length; j++) {
        const a = pontos[j], b = pontos[(j + 1) % pontos.length];
        const da = a[0] * nx + a[2] * nz - apotema;
        const db = b[0] * nx + b[2] * nz - apotema;
        if (da <= 0) saida.push(a);
        if ((da <= 0) !== (db <= 0)) {
          const t = da / (da - db);
          saida.push(a.map((v, k) => v + (b[k] - v) * t));
        }
      }
      pontos = saida;
    }
    return pontos;
  }
  function adicionarFace(dados, pontos, normal, tamanhoTextura, recortarBorda = true) {
    if (recortarBorda) pontos = recortar(pontos);
    if (pontos.length < 3) return;
    const inicio = dados.position.length / 3;
    for (const [x, y, z] of pontos) {
      dados.position.push(x, y, z);
      dados.normal.push(...normal);
      dados.texcoord.push((normal[1] ? x : x + z) / tamanhoTextura,
        (normal[1] ? z : -y) / tamanhoTextura);
      if (dados === agua) agua.depth.data.push(profundidadeVertice(x, z));
    }
    for (let i = 1; i < pontos.length - 1; i++) {
      dados.indices.push(inicio, inicio + i, inicio + i + 1);
    }
  }

  for (let linha = 0; linha < divisoes; linha++) {
    for (let coluna = 0; coluna < divisoes; coluna++) {
      const x0 = -meiaLargura + coluna * tamanhoBloco, x1 = x0 + tamanhoBloco;
      const z0 = -meiaLargura + linha * tamanhoBloco, z1 = z0 + tamanhoBloco;
      const y = alturaCelula(coluna, linha);
      const topo = recortar([[x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]]);
      adicionarFace(y > 0 ? areia : agua, topo, [0, 1, 0], y > 0 ? 2 : 4, false);
      // O recorte circular cria arestas novas que não pertencem aos quatro
      // lados da célula. Fecha essas arestas até dentro do casco, evitando
      // enxergar o céu por baixo da areia ao olhar a ilha por trás.
      for (let i = 0; i < topo.length; i++) {
        const a = topo[i], b = topo[(i + 1) % topo.length];
        const mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2;
        if (Math.hypot(mx, mz) < apotema - 0.000001) continue;
        const dx = b[0] - a[0], dz = b[2] - a[2];
        const comprimento = Math.hypot(dx, dz);
        if (comprimento < 0.000001) continue;
        adicionarFace(y > 0 ? lateral : fundo,
          [[a[0], -3, a[2]], [b[0], -3, b[2]], b, a],
          [-dz / comprimento, 0, dx / comprimento], 2, false);
      }
      if (y === 0) {
        const chao = -profundidadeCelula(coluna, linha);
        adicionarFace(fundo, [[x0, chao, z0], [x0, chao, z1],
          [x1, chao, z1], [x1, chao, z0]], [0, 1, 0], 2);
        const vizinhos = [
          { c: coluna - 1, l: linha, normal: [-1, 0, 0], a: [x0, z0], b: [x0, z1] },
          { c: coluna + 1, l: linha, normal: [1, 0, 0], a: [x1, z1], b: [x1, z0] },
          { c: coluna, l: linha - 1, normal: [0, 0, -1], a: [x1, z0], b: [x0, z0] },
          { c: coluna, l: linha + 1, normal: [0, 0, 1], a: [x0, z1], b: [x1, z1] },
        ];
        for (const v of vizinhos) {
          if (v.c < 0 || v.c >= divisoes || v.l < 0 || v.l >= divisoes || alturaCelula(v.c, v.l) > 0) continue;
          const baixo = -profundidadeCelula(v.c, v.l);
          if (baixo >= chao) continue;
          adicionarFace(fundo, [[v.a[0], baixo, v.a[1]], [v.b[0], baixo, v.b[1]],
            [v.b[0], chao, v.b[1]], [v.a[0], chao, v.a[1]]], v.normal, 2);
        }
        continue;
      }
      // Fecha somente os lados expostos, formando os degraus e a borda da areia.
      const lados = [
        { c: coluna - 1, l: linha, altura: alturaCelula(coluna - 1, linha), normal: [-1, 0, 0], a: [x0, z0], b: [x0, z1] },
        { c: coluna + 1, l: linha, altura: alturaCelula(coluna + 1, linha), normal: [1, 0, 0], a: [x1, z1], b: [x1, z0] },
        { c: coluna, l: linha - 1, altura: alturaCelula(coluna, linha - 1), normal: [0, 0, -1], a: [x1, z0], b: [x0, z0] },
        { c: coluna, l: linha + 1, altura: alturaCelula(coluna, linha + 1), normal: [0, 0, 1], a: [x0, z1], b: [x1, z1] },
      ];
      for (const lado of lados) {
        if (lado.altura >= y) continue;
        const baixo = lado.altura > 0 ? lado.altura : -profundidadeCelula(lado.c, lado.l);
        const [ax, az] = lado.a, [bx, bz] = lado.b;
        adicionarFace(lateral, [[ax, baixo, az], [bx, baixo, bz],
          [bx, y, bz], [ax, y, az]], lado.normal, 2);
      }
    }
  }
  return { areia, agua, lateral, fundo, alturaTerreno, profundidadeAgua };
}
