# Marcos de implementação

## Base inicial

Hemisfério inferior branco, faixa escura e superfície circular provisória com
raio de 16 unidades. Sem botão ou tampa. Câmera manual com arrasto e zoom.

## Prova de Slowpoke — implementação

Modelo normal de Kanto carregado diretamente do formato Bedrock com TWGL.
Textura com filtro nearest e transparência por descarte de pixels. Ossos e cubos
preservam pivôs e rotações; os planos do rosto e da ponta da cauda são desenhados
dos dois lados. O personagem fica no centro da plataforma, com `ground_idle`
adaptado manualmente e tempo limitado após suspensão da aba.

Verificações executadas: sintaxe dos módulos; geração dos dados dos 30 ossos;
presença de geometria nos quatro segmentos da cauda; intervalos das UVs; índices
dos triângulos; matrizes finitas em diferentes tempos; independência da ordem dos
ossos; variação da transformação da cauda durante a animação.

Pendente: validação visual no navegador de frente, de costas e pelas laterais,
incluindo textura, olhos, boca, cauda, contato das patas com a base e repouso.
A validação visual do protótipo antigo não comprova a aparência desta versão.
O navegador de teste não conseguiu acessar o servidor local na sessão anterior.

Ainda não implementados nesta etapa: caminhada, poses, navegação, evolução,
outros Pokémon, cenário definitivo e skinning. A etapa 1 do plano só deve ser
considerada validada após a inspeção visual.

## Caminhos e movimentação

Grafos separados para terra e água, construídos a partir do terreno atual e dos
raios dos objetos do cenário. O Slowpoke alterna repouso e caminhada, segue rotas
terrestres e vira gradualmente. O passeio usa áreas planas largas o suficiente
para o corpo e a cauda; os degraus e as margens ficam fora do passeio nesta etapa.
O grafo aquático fica preparado para Shellder, que ainda não foi integrado.

`M` pausa/retoma sem descartar a rota. `R` restaura posição, orientação,
temporizadores e animação do Slowpoke, mantendo câmera e iluminação.

Verificações: cinco minutos de passeio simulado no cenário atual; validade das
rotas e conexões; limite de velocidade e giro; pausa e reinício; ciclo de
animação e transições sem cruzar o chão; corpo dentro da folga de navegação.
Conferência visual da caminhada pendente. Evolução ainda pendente.

Viradas revisadas: percursos curvos validados antes de caminhar, avanço na direção
do corpo e aceleração angular gradual. Testadas meias-voltas pelos dois lados e
três passeios simulados de cinco minutos, sem rotações paradas ou saída da área segura.

## Quatro poses do Slowpoke

`P` percorre centro, dormindo deitado perto do mar, deitado acordado próximo ao guarda-sol
e deitado na margem com a cauda na água. Os destinos têm posições e orientações
distintas. No modo caminhar, a chegada usa curvas e uma aproximação alinhada; a
postura muda após o deslocamento. O seletor em Comandos também permite
teletransportar diretamente para posição, orientação e postura finais.
Poses permanecem ativas até `P`, `M` ou `R`.

O grafo de aproximação permite chegar mais perto da margem, mantendo as patas em
terra. A altura de apoio é calculada pelos vértices transformados do personagem.
Na quarta pose a cauda desce depois da areia, e a ponta é obtida da matriz do osso
`tail4`, ficando disponível para a futura sequência de Shellder.

Verificado em simulação: ciclo completo e retorno à primeira pose, troca de
destino com `P` repetido, saída por `M`, reinício em diferentes fases, continuidade
de posição e orientação, apoio sobre areia e ponta da cauda dentro da água.
A aparência das posturas ainda precisa ser conferida no navegador. A evolução
não está implementada nesta etapa.

Revisão das posturas: a antiga pose sentada foi substituída por barriga baixa e
patas recolhidas. A pose de sono fecha as pálpebras usando os ossos do clipe blink;
a terceira pose fica de barriga para baixo, com olhos e boca abertos.
A pose da margem foi aproximada da água, com o centro da ponta da
cauda cerca de 0,42 unidade abaixo da superfície e parte da geometria final
submersa. Conferidos os dois modos, troca de modo em movimento, interrupção da
aproximação por `P`, retorno por `M`, reinício e transições sem atravessar a areia.

## Água com profundidade

Fundo de areia submerso em degraus, com profundidade de 0,60 a 1,68 unidade.
A parte superior da caixa é oca e a borda preta é uma moldura, para o fundo ficar
visível. A geometria da ilha e a função de altura usada na navegação permanecem.

Shaders `agua.vert.glsl` e `agua.frag.glsl`: ondas de baixa amplitude, normais
correspondentes, duas camadas de textura pixelada em movimento, cor e opacidade
conforme a profundidade e brilho Blinn-Phong. A água é desenhada após cenário e
personagem, com blending e escrita de profundidade desativada apenas nessa passagem.
`L` também alterna a iluminação da água.

Verificados cobertura do fundo, índices/normais, continuidade das ondas nos
vértices compartilhados, espaço livre na caixa, uniforms e restauração do estado
de transparência. Poses, caminhos e reinício conferidos em simulação. A mandíbula
dos clipes Cobblemon teve o eixo X adaptado para abrir a boca nas poses acordadas;
a pose de sono permanece com a boca fechada. Aparência final pendente de revisão
no navegador.

## Shellder na água

Modelo e textura do Cobblemon, com repouso, nado, movimento da língua e da concha.
Percursos curvos na maior região aquática disponível e flutuação acompanhando as
ondas. A margem de navegação considera o tamanho da geometria animada; a altura
mantém a parte inferior submersa, acima do fundo. Desenhado antes da água transparente.
`M` pausa/retoma os dois personagens e `R` reinicia ambos. As poses continuam
exclusivas do Slowpoke; a interação com a cauda e a evolução ficam para outra etapa.

Verificado em três simulações de três minutos, com sementes diferentes: mais de
82 unidades percorridas em cada uma, vértices fora da areia e da borda, sem contato
com o fundo. Conferidos pausa, reinício e matrizes finitas. Aparência final ainda
depende de conferência no navegador.

Revisão: Shellder mais submerso, com imersão de até 0,95 unidade e limite
conservador conforme o fundo sob a geometria. A profundidade é interpolada para
evitar saltos ao passar pelos degraus. Três novas simulações de três minutos
confirmaram ausência de contato com areia e fundo, pausa e reinício funcionando.

Carregamento: imagens antecipadas no HTML e downloads dos dois Pokémon iniciados
junto aos shaders, antes da preparação do cenário e da navegação. A calibração
da concha mede apenas vértices únicos e calcula diretamente a coordenada Y,
preservando o resultado anterior. O cálculo ficou mais rápido na medição local;
o tempo total de abertura ainda precisa ser medido no navegador.

## Aproximação e mordida

`interacao.js` acompanha a conclusão da quarta pose e espera 5 segundos. Depois
assume o Shellder, planeja uma chegada curva pela água e alinha a abertura da
concha com um ponto transformado de `tail4`, dentro da parte branca da cauda.
Uma região aquática com margem menor é preparada apenas quando necessária; a
geometria animada também é conferida contra areia, fundo e limites da base.

A língua é recolhida, a concha fecha em 0,9 segundo e o Slowpoke reage com a
cabeça e a mandíbula. O Shellder permanece preso ao ponto da cauda. Antes da
mordida, trocar pose ou retomar o passeio cancela a interação e o faz recuar pelo
trajeto percorrido. `P`/`M` ficam bloqueados durante o fechamento; nesta etapa,
voltam a funcionar após a mordida e também permitem soltar a cauda. `R` restaura
os personagens a qualquer momento. A transformação em Slowbro ainda não existe.

Simuladas chegadas nos modos caminhar e teletransportar, com sementes diferentes:
espera iniciada somente após a postura, fechamento, fixação na cauda, geometria
sem contato com areia/fundo/borda e deslocamento contínuo. Conferidos cancelamento
na espera e durante a aproximação, recuo perto da cauda e após prender a concha.
Conferidos reinícios em todas as fases e acionamento após passeios prolongados.
Aparência final pendente de conferência no navegador.

## Evolução para Slowbro

Depois da mordida, transformação automática de 2,5 segundos com brilho local nos
personagens e 40 partículas em cubos. A troca ocorre no platô branco do efeito:
somente Slowbro é desenhado depois disso, com a concha original já na cauda.
Shaders GLSL separados para as partículas; emissividade controlada no shader
básico somente para os personagens em evolução. Transparência restaurada antes
da água. Os recursos do Slowbro são carregados em paralelo aos demais.

Repouso, caminhada e piscadas adaptados dos clipes Cobblemon. Escala 0,15 e apoio
parametrizado, preservando a escala anterior do Slowpoke. O Slowbro espera 1,5
segundo, sai da margem por rota validada e passeia em uma região com folga de
4,05 unidades para o corpo/concha e espaço para realizar as curvas.

`P` e `M` bloqueados da mordida até o fim da transformação. Depois, `P` não muda
a postura do Slowbro e `M` pausa/retoma seu passeio. `R` restaura Slowpoke e
Shellder separados e limpa o efeito em qualquer etapa. Se o recurso novo falhar,
os personagens originais continuam visíveis; a mordida aguarda os três modelos.

Sons não foram integrados, conforme solicitado. Seis OGG originais (ambient e
cry de Slowpoke, Shellder e Slowbro) em `assets/sons-para-ouvir/`, com página de
escuta manual e créditos. Não há som específico da transformação no pacote.

Simulações de 190 segundos com três sementes e os dois modos de pose: uma única
troca de modelos por ciclo, brilho máximo na troca, apoio acima do terreno,
limites e objetos respeitados, movimento contínuo e passeio mantido até o fim.
Conferidos pausa/retomada e reinícios na espera, aproximação, mordida, antes e
depois da troca, e após a evolução. Conferida também a ausência de evolução
quando o novo modelo ainda não está disponível.
Verificações numéricas e de sintaxe concluídas. A tentativa de validação no Edge
headless não concluiu a captura; aparência e efeitos ainda precisam de revisão no navegador.

## Vento e neblina

Vento direcional com rajadas suaves, compartilhado pela vegetação, catavento e
água. As 182 partes de folhas dos coqueiros e samambaias são deformadas no vertex
shader, preservando as raízes e corrigindo as normais. Troncos, objetos fixos e
Pokémon não recebem a deformação. A hélice varia a velocidade sem saltos de fase.

Ondas e deslocamento das texturas acompanham a direção do vento. A flutuação do
Shellder usa a mesma fórmula de altura e o relógio da cena. Ondas máximas abaixo
de 0,047 unidade, amortecidas junto à moldura. Água rasa menos clara e um pouco
mais opaca, com brilho especular limitado e atenuado na margem e na borda externa.

Neblina leve por distância, inicialmente ativa, alternada por `N`. Aplica-se ao
cenário, personagens, água e partículas, inclusive com `L` desligado. A faixa
acompanha a distância da câmera para manter a ilha legível ao usar zoom. `R`
reinicia os personagens preservando vento, tempo e escolha da neblina.

Verificados: continuidade das rajadas, amplitude e contenção das ondas, matrizes
dos objetos fixos preservadas, interfaces e precisões compartilhadas dos três
programas GLSL. Simuladas quatro sequências completas de evolução, com três
sementes, nos dois modos de pose, usando o relógio compartilhado da água. Sintaxe
e diferenças de código conferidas. Aparência final pendente de revisão no navegador.
