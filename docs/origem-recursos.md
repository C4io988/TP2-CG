# Origem dos recursos utilizados

- Slowbro normal de Kanto: modelo, textura 128 × 64, animações, poser e resolver
  separados do mesmo pacote Cobblemon 1.7.3. Clipes de repouso, caminhada e piscadas
  adaptados em `src/animacoes-slowbro.js`; rotações X convertidas ao carregar.
  A concha é parte do modelo original. Brilho e partículas da evolução são próprios.
- Sons originais `ambient` e `cry` dos três Pokémon copiados sem alterações para
  `assets/sons-para-ouvir/`, exclusivamente para escuta manual. Não são carregados
  pela cena. Nenhum som específico de transformação foi encontrado no pacote.

- TWGL.js 7.0.0: dependência local já presente no projeto; licença MIT de Gregg
  Tavares preservada no cabeçalho da própria biblioteca.
- Slowpoke normal de Kanto: `slowpoke.geo.json`, `slowpoke.png` e
  `slowpoke.animation.json` copiados de `Recursos Pokemon/assets/cobblemon/`.
  Segundo o `LEIA-ME.txt` do pacote, foram extraídos de
  `Cobblemon-fabric-1.7.3+1.21.1.jar`.
- Créditos e links das licenças registrados no README; sem cópias separadas.
- Shellder: `shellder.geo.json`, `shellder.png` e `shellder.animation.json`
  copiados do mesmo pacote. Os clipes `water_idle` e `water_swim` foram adaptados
  em JavaScript; a navegação controla o deslocamento e a direção. As rotações X
  da concha são convertidas ao carregar o modelo, sem alterar o JSON original.
- `src/cobblemon.js` e `src/animacoes.js`: adaptados do protótipo local
  `Paraiso OG`, fornecido pelo usuário. Foram ajustados os atributos dos shaders,
  a resolução da hierarquia e a integração com a base atual. O repouso é uma
  adaptação manual de `animation.slowpoke.ground_idle`, sem `eval`.

O JSON de animação original é mantido como referência; não é um interpretador
genérico de animações Cobblemon. As regras de variantes do poser não são aplicadas:
nesta prova, todos os segmentos da cauda normal permanecem presentes.

Autoria individual dos recursos e condições específicas de publicação ainda
devem ser conferidas antes da entrega. O ZIP e o JAR completos não foram copiados
para o projeto.

