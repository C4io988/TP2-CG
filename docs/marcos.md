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
Conferência visual da caminhada pendente. Poses com `P` e evolução ainda pendentes.

Viradas revisadas: percursos curvos validados antes de caminhar, avanço na direção
do corpo e aceleração angular gradual. Testadas meias-voltas pelos dois lados e
três passeios simulados de cinco minutos, sem rotações paradas ou saída da área segura.
