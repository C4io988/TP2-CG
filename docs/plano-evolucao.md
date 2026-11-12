# Evolução para Slowbro — plano aprovado

Plano aprovado para implementação, com alteração solicitada em 12/11/2026:
nenhum som na cena. Sons originais separados em `assets/sons-para-ouvir/`, com
uma página para escuta manual. A evolução usa somente o efeito visual.

## Recursos do Cobblemon separados

Forma normal de Kanto, do pacote local extraído do Cobblemon 1.7.3:

| Arquivo em `assets/pokemon/` | Uso previsto |
| --- | --- |
| `models/slowbro.geo.json` | Modelo completo, incluindo a concha na cauda |
| `textures/slowbro.png` | Textura original, 128 × 64 pixels |
| `animations/slowbro.animation.json` | Referência para repouso, caminhada, piscadas e grito |
| `posers/slowbro.json` | Referência da postura padrão e combinações de clipes |
| `resolvers/slowbro.json` | Confirmação da variante, modelo e textura |
| `../sons-para-ouvir/slowbro_cry.ogg` | Grito original reservado para escuta fora da cena |

Arquivos copiados sem alterações, com hashes conferidos contra a origem.
Poser e resolver são referências: não exigem um interpretador genérico no projeto.
Créditos continuarão no README, junto aos links já usados para os recursos Cobblemon.

O modelo contém 49 ossos e 62 cubos. As UVs usam o formato já aceito pelo
carregador. A concha tem mandíbula e olhos próprios: após a troca, o Shellder
separado precisa ser ocultado para não aparecer duplicado.

Clipes úteis: `ground_idle`, `ground_walk`, `blink1` (Slowbro), `blink2` (concha)
e `cry`. `bite_quirk` é uma reação da concha já acoplada, não uma transformação.
Também há clipes de água, sono e batalha, dispensáveis nesta etapa.

O pacote extraído e seu ZIP não contêm um clipe de evolução, partículas ou som
específico da transformação. O JAR completo não está neste workspace. Não é
necessário obter outro arquivo para a transição simples proposta abaixo.

## Sequência proposta

1. Manter a quarta pose, a espera de 5 segundos e a aproximação atuais.
2. Ao terminar o fechamento da concha, iniciar automaticamente a transformação.
3. Durante cerca de 2,5 segundos, clarear os personagens e emitir poucas
   partículas quadradas ao redor deles, mantendo o estilo pixelado.
4. No pico do brilho, ocultar Slowpoke e Shellder e mostrar Slowbro no mesmo
   local da interação, ajustando o apoio dos pés ao relevo. Dissipar o brilho.
5. Apresentar Slowbro em repouso por cerca de 1,5 segundo. Depois, fazê-lo
   retornar à área de passeio e caminhar.

A troca de modelos representa a evolução; não há morph contínuo nem deformação
entre espécies. O efeito visual será criado no projeto em WebGL/TWGL, com GLSL
em arquivos separados. Brilho local nos personagens, sem clarear a tela inteira
ou depender de pós-processamento. Partículas simples não precisam de nova textura.

Não integrar som, controles de áudio ou música nesta etapa. A página de escuta é
separada do projeto principal, sem reprodução automática.

## Controles e estados

- Antes da mordida, `P` e `M` continuam cancelando a interação.
- Da mordida até a conclusão da transformação, bloquear `P` e `M`.
- Depois da evolução, `P` não troca poses: Slowbro terá somente postura padrão.
- `M` pausa/retoma o passeio de Slowbro.
- `R` cancela qualquer fase e restaura Slowpoke e Shellder separados, incluindo
  visibilidade, caminhos, temporizadores e efeito.
- Câmeras, zoom e `L` continuam funcionando durante toda a sequência. Reinício
  preserva câmera e iluminação.

Estados da sequência: espera, aproximação, mordida, transformação e conclusão.
O estado de passeio de Slowbro permanece separado. A liberação da cauda após a
mordida, provisória na etapa anterior, será substituída pela evolução automática.

## Ajustes técnicos previstos

- `recursos.js` e `main.js`: carregar Slowbro antecipadamente, em paralelo,
  reaproveitando o carregador e a filtragem pixelada. Só permitir a mordida que
  dispara evolução depois que o novo modelo estiver pronto; em falha, manter os
  personagens existentes e informar o erro, sem deixá-los invisíveis.
- `interacao.js`: estender os estados existentes com transformação e conclusão;
  manter a aproximação já validada e garantir uma única troca de modelos.
- `slowbro.js`: controlador pequeno de repouso, saída da margem e passeio.
  Reutilizar o cálculo de rotas e viradas, sem herdar as quatro poses do Slowpoke.
- `animacoes.js`: adaptar somente os clipes necessários, sem `eval`. O arquivo
  original contém canais de ossos ausentes, como `leftarm`/`rightarm`; usar os
  ossos efetivos `arm_left`/`arm_right`, já animados pelo próprio clipe.
- `cobblemon.js`: parametrizar a escala no cálculo de apoio, preservando o padrão
  atual do Slowpoke. Conferir rotações X, mandíbula e orientação da concha para
  não repetir os problemas de cauda enterrada e boca fechada.
- `efeito-evolucao.js` e shaders GLSL: brilho e pequenas partículas com duração
  limitada; restaurar o estado de transparência antes de desenhar a água.
- Sons: arquivos originais separados para escuta, sem carregamento ou reprodução
  pela cena. O pacote não contém um som específico da transformação.

O Slowbro é mais alto e sua concha ocupa mais espaço. Começar avaliando escala
0,15, depois ajustar visualmente. A análise numérica inicial confirmou que a
hierarquia pode ser lida pelo carregador e que inverter X no modelo e nos clipes
evita a concha abaixo dos pés na postura amostrada. Isso ainda não comprova a
aparência de todas as animações. Medir novamente o apoio, os limites da base e a
folga dos caminhos antes de fixar escala e posição; conferir especialmente a
saída da margem para não atravessar degraus, água ou objetos.

## Validação após aprovação

- Ciclo completo nos modos caminhar e teletransportar, inclusive após passeios longos.
- Aproximação cancelável antes da mordida e bloqueio temporário durante a evolução.
- `R` na espera, aproximação, mordida, transformação e após aparecer Slowbro.
- Slowbro sozinho após a evolução, sem Shellder ou Slowpoke duplicados.
- Pés apoiados, concha acima do fundo e dentro da base, rotas sem atravessar objetos.
- Repouso, caminhada e piscadas do corpo e da concha conferidos visualmente.
- Sem erro de GLSL ou arquivos ausentes. Sons fora do carregamento da cena.
- Carregamento antecipado e custo limitado das partículas, sem repetir calibrações
  pesadas a cada frame. Verificações numéricas complementadas por revisão no navegador.

Incremento implementado sem áudio na cena. Resultados das verificações registrados
em `marcos.md`; aparência final pendente de revisão no navegador. Sem commit automático.
