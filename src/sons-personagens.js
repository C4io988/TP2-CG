// Relógios separados; a defasagem de 0,5 s evita coincidências a cada 42 s.
export function criarSonsPersonagens(tocar, parar) {
  let ligado = false, estadoAnterior = 'inactive', broAnterior = false;
  let tempos;
  function reiniciarTempos() { tempos = { slowpoke: 6, shellder: 7.5, slowbro: 4 }; }
  reiniciarTempos();
  return {
    definirLigado(valor) {
      ligado = valor;
      reiniciarTempos();
      if (!ligado) parar();
    },
    reiniciar() {
      parar();
      reiniciarTempos();
      estadoAnterior = 'inactive';
      broAnterior = false;
    },
    atualizar(delta, { estado, slowbro, slowpoke, shellder }) {
      const inicio = estado === 'transforming' && estadoAnterior !== 'transforming';
      const apareceu = slowbro && !broAnterior;
      estadoAnterior = estado;
      broAnterior = slowbro;
      if (!ligado) return;
      if (inicio) { parar(); tocar('evolucao'); reiniciarTempos(); }
      if (apareceu) { tocar('slowbro'); tempos.slowbro = 4; }
      if (estado === 'transforming' || estado === 'failed') return;
      const presentes = slowbro ? ['slowbro'] : [slowpoke && 'slowpoke', shellder && 'shellder'].filter(Boolean);
      for (const nome of presentes) {
        tempos[nome] -= delta;
        if (tempos[nome] <= 0) {
          tocar(nome);
          tempos[nome] += nome === 'shellder' ? 7 : nome === 'slowpoke' ? 6 : 4;
        }
      }
    },
  };
}

export function criarAudioPersonagens(volumeEfeitos = () => 0.175) {
  let contexto, carregamento;
  const buffers = new Map(), fontes = new Map();
  function parar() {
    for (const fonte of fontes.values()) fonte.stop();
    fontes.clear();
  }
  const controle = criarSonsPersonagens(nome => {
    if (!buffers.has(nome) || contexto.state !== 'running') return;
    fontes.get(nome)?.stop();
    const fonte = contexto.createBufferSource();
    const volume = contexto.createGain();
    fonte.buffer = buffers.get(nome);
    volume.gain.value = volumeEfeitos();
    fonte.connect(volume).connect(contexto.destination);
    fonte.onended = () => {
      if (fontes.get(nome) === fonte) fontes.delete(nome);
      fonte.disconnect(); volume.disconnect();
    };
    fontes.set(nome, fonte);
    fonte.start();
  }, parar);
  return {
    ...controle,
    async preparar() {
      contexto ??= new AudioContext();
      // Resume é chamado dentro do clique para liberar o áudio no navegador.
      const liberado = contexto.resume();
      carregamento ??= Promise.all(['slowpoke', 'shellder', 'slowbro', 'evolucao'].map(async nome => {
        const resposta = await fetch(new URL(`../assets/audio/${nome}.mp3`, import.meta.url));
        if (!resposta.ok) throw new Error(`Falha ao carregar ${nome}`);
        buffers.set(nome, await contexto.decodeAudioData(await resposta.arrayBuffer()));
      })).catch(erro => { carregamento = null; throw erro; });
      await Promise.all([liberado, carregamento]);
    },
  };
}
