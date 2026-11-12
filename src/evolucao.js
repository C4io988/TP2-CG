export function criarEvolucao(interacao, slowpoke, slowbro) {
  let estado = 'inactive', tempo = 0;
  const centro = [0, 0, 0];
  return {
    centro,
    get estado() { return estado; },
    get bloqueada() { return interacao.bloqueada || estado === 'transforming'; },
    get progresso() { return estado === 'transforming' ? tempo / 2.5 : 0; },
    get brilho() {
      // Platô branco cobre a troca, mesmo com frames mais demorados.
      return estado === 'transforming' ? Math.min(1, tempo / 0.8, (2.5 - tempo) / 0.8) : 0;
    },
    reiniciar() { estado = 'inactive'; tempo = 0; },
    atualizar(delta, pronto) {
      const dt = Math.max(0, Math.min(delta, 0.05));
      if (estado === 'inactive' && interacao.estado === 'attached' && pronto) {
        centro.splice(0, 3, ...slowpoke.posicao);
        estado = 'transforming';
        tempo = 0;
      }
      if (estado !== 'transforming') return;
      tempo = Math.min(2.5, tempo + dt);
      if (tempo >= 1.25 && !slowbro.visivel) {
        try {
          slowbro.revelar(slowpoke.posicao, slowpoke.angulo);
        } catch (erro) {
          estado = 'failed';
          throw erro;
        }
      }
      if (tempo >= 2.5) {
        estado = 'complete';
        slowbro.iniciarPasseio();
      }
    },
  };
}
