import { criarAudioPersonagens } from './sons-personagens.js?v=intervalos-6-7';

export function iniciarSom(audio, botao, aviso) {
  const efeitos = criarAudioPersonagens(() => audio.volume * 0.5);
  const icone = botao.querySelector('img');
  audio.loop = true;
  audio.muted = true;
  audio.volume = 0.35;
  audio.pause();

  function atualizar() {
    const ligado = !audio.paused && !audio.muted;
    botao.setAttribute('aria-pressed', String(ligado));
    icone.src = new URL(ligado ? '../assets/icons/som-ligado.png' : '../assets/icons/som-desligado.png', import.meta.url).href;
    botao.setAttribute('aria-label', ligado ? 'Desligar som' : 'Ligar som');
  }

  botao.addEventListener('click', async () => {
    aviso.textContent = '';
    if (!audio.paused) {
      audio.pause();
      audio.muted = true;
      efeitos.definirLigado(false);
      atualizar();
      return;
    }
    botao.disabled = true;
    try {
      // A reprodução começa somente após o clique, conforme a política do navegador.
      audio.muted = false;
      await Promise.all([audio.play(), efeitos.preparar()]);
      efeitos.definirLigado(true);
    } catch {
      audio.pause();
      audio.muted = true;
      efeitos.definirLigado(false);
      aviso.textContent = 'Não foi possível reproduzir o áudio. Clique no botão de som para tentar novamente.';
    } finally {
      botao.disabled = false;
      atualizar();
    }
  });
  audio.addEventListener('play', atualizar);
  audio.addEventListener('pause', () => { efeitos.definirLigado(false); atualizar(); });
  audio.addEventListener('error', () => {
    audio.pause();
    audio.muted = true;
    aviso.textContent = 'Não foi possível carregar a música.';
    atualizar();
  });
  atualizar();
  return efeitos;
}
