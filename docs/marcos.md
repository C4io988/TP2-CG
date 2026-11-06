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
