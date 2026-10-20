// O eixo local X aponta para o mar, na direção da câmera inicial.
const AZIMUTE_PRAIA = 0.35;
const SENO = Math.sin(AZIMUTE_PRAIA);
const COSSENO = Math.cos(AZIMUTE_PRAIA);

export function posicaoNaPraia(distancia, lateral = 0) {
  return [SENO * distancia - COSSENO * lateral,
    COSSENO * distancia + SENO * lateral];
}

export function criarGeometriaPraia(raio, segmentos = 160) {
  const passo = 2 * Math.PI / segmentos;
  const suave = t => {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  };

  function limiteAreia(angulo) {
    // Curvas de tamanhos diferentes criam os braços e reentrâncias da ameba.
    const formato = 0.72
      + Math.sin(angulo * 3 + 0.5) * 0.13
      + Math.cos(angulo * 5 - 0.3) * 0.075
      + Math.sin(angulo * 2 + 0.8) * 0.035;
    // Mantém uma ligação seca atrás, como na versão anterior.
    const distanciaAtras = Math.acos(Math.max(-1, Math.min(1, -Math.cos(angulo))));
    const ligacao = 1 - suave((distanciaAtras - 0.25) / 0.65);
    return raio * (formato + 0.5 * ligacao);
  }

  const costa = angulo => Math.min(raio, limiteAreia(angulo));

  function alturaLocal(x, z) {
    const distanciaMargem = limiteAreia(Math.atan2(z, x)) - Math.hypot(x, z);
    return 1.1 * suave(distanciaMargem / 4);
  }
  function alturaTerreno(x, z) {
    return alturaLocal(SENO * x + COSSENO * z, -COSSENO * x + SENO * z);
  }

  const malha = () => ({ position: [], normal: [], texcoord: [], indices: [] });
  const areia = malha(), agua = malha(), lateral = malha();
  const ponto = (angulo, distancia) => [Math.cos(angulo) * distancia, Math.sin(angulo) * distancia];

  function adicionarTopo(dados, pontos, elevar, tamanhoTextura) {
    const inicio = dados.position.length / 3;
    for (const [x, z] of pontos) {
      const [mundoX, mundoZ] = posicaoNaPraia(x, z);
      dados.position.push(mundoX, elevar ? alturaLocal(x, z) : 0, mundoZ);
      const dx = elevar ? (alturaLocal(x + 0.01, z) - alturaLocal(x - 0.01, z)) / 0.02 : 0;
      const dz = elevar ? (alturaLocal(x, z + 0.01) - alturaLocal(x, z - 0.01)) / 0.02 : 0;
      const [nx, nz] = posicaoNaPraia(-dx, -dz);
      const comprimento = Math.hypot(nx, 1, nz);
      dados.normal.push(nx / comprimento, 1 / comprimento, nz / comprimento);
      dados.texcoord.push(x / tamanhoTextura, z / tamanhoTextura);
    }
    dados.indices.push(inicio, inicio + 1, inicio + 2, inicio, inicio + 2, inicio + 3);
  }

  function adicionarLateral(a, b) {
    const yA = alturaLocal(...a), yB = alturaLocal(...b);
    if (yA < 0.000001 && yB < 0.000001) return;
    const inicio = lateral.position.length / 3;
    for (const [x, y, z] of [[a[0], 0, a[1]], [a[0], yA, a[1]], [b[0], yB, b[1]], [b[0], 0, b[1]]]) {
      const [mundoX, mundoZ] = posicaoNaPraia(x, z);
      lateral.position.push(mundoX, y, mundoZ);
      lateral.normal.push(mundoX / raio, 0, mundoZ / raio);
      lateral.texcoord.push((x + z) / 2, y / 2);
    }
    lateral.indices.push(inicio, inicio + 1, inicio + 2, inicio, inicio + 2, inicio + 3);
  }

  for (let i = 0; i < segmentos; i++) {
    const anguloA = i * passo, anguloB = (i + 1) * passo;
    const costaA = costa(anguloA), costaB = costa(anguloB);
    for (let anel = 0; anel < 24; anel++) {
      const dentro = anel / 24, fora = (anel + 1) / 24;
      adicionarTopo(areia, [ponto(anguloA, costaA * dentro), ponto(anguloB, costaB * dentro),
        ponto(anguloB, costaB * fora), ponto(anguloA, costaA * fora)], true, 2);
    }
    adicionarTopo(agua, [ponto(anguloA, costaA), ponto(anguloB, costaB),
      ponto(anguloB, raio), ponto(anguloA, raio)], false, 4);
    // Fecha a pequena transição onde a margem encontra a ligação seca de trás.
    if (costaA < raio || costaB < raio) {
      adicionarLateral(ponto(anguloA, costaA), ponto(anguloB, costaB));
    }
    adicionarLateral(ponto(anguloA, raio), ponto(anguloB, raio));
  }
  return { areia, agua, lateral, alturaTerreno };
}
