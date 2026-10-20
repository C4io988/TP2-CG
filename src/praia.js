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
    return bordaQuadrada * (formato + 0.5 * ligacao);
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
    return alturaCelula(Math.floor((x + meiaLargura) / tamanhoBloco),
      Math.floor((z + meiaLargura) / tamanhoBloco));
  }

  const malha = () => ({ position: [], normal: [], texcoord: [], indices: [] });
  const areia = malha(), agua = malha(), lateral = malha();
  function adicionarFace(dados, pontos, normal, tamanhoTextura) {
    const inicio = dados.position.length / 3;
    for (const [x, y, z] of pontos) {
      dados.position.push(x, y, z);
      dados.normal.push(...normal);
      dados.texcoord.push((normal[1] ? x : x + z) / tamanhoTextura,
        (normal[1] ? z : -y) / tamanhoTextura);
    }
    dados.indices.push(inicio, inicio + 1, inicio + 2, inicio, inicio + 2, inicio + 3);
  }

  for (let linha = 0; linha < divisoes; linha++) {
    for (let coluna = 0; coluna < divisoes; coluna++) {
      const x0 = -meiaLargura + coluna * tamanhoBloco, x1 = x0 + tamanhoBloco;
      const z0 = -meiaLargura + linha * tamanhoBloco, z1 = z0 + tamanhoBloco;
      const y = alturaCelula(coluna, linha);
      adicionarFace(y > 0 ? areia : agua,
        [[x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]], [0, 1, 0], y > 0 ? 2 : 4);
      if (y === 0) continue;
      // Fecha somente os lados expostos, formando os degraus e a borda da areia.
      const lados = [
        { altura: alturaCelula(coluna - 1, linha), normal: [-1, 0, 0], a: [x0, z0], b: [x0, z1] },
        { altura: alturaCelula(coluna + 1, linha), normal: [1, 0, 0], a: [x1, z1], b: [x1, z0] },
        { altura: alturaCelula(coluna, linha - 1), normal: [0, 0, -1], a: [x1, z0], b: [x0, z0] },
        { altura: alturaCelula(coluna, linha + 1), normal: [0, 0, 1], a: [x0, z1], b: [x1, z1] },
      ];
      for (const lado of lados) {
        if (lado.altura >= y) continue;
        const [ax, az] = lado.a, [bx, bz] = lado.b;
        adicionarFace(lateral, [[ax, lado.altura, az], [bx, lado.altura, bz],
          [bx, y, bz], [ax, y, az]], lado.normal, 2);
      }
    }
  }
  return { areia, agua, lateral, alturaTerreno };
}
