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
