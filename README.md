# Paraíso Pokémon

Trabalho de Computação Gráfica em JavaScript, WebGL e TWGL.js.
Shaders GLSL em `src/shaders/`, separados em vertex e fragment shader.

Por enquanto: ilha e relevo em blocos, mar e Slowpoke passeando sobre uma base quadrada.
Água pixelada com transparência, fundo em degraus, ondas suaves e textura animada.
Coqueiros, vegetação, pedras, cocos, conchas, guarda-sol, catavento giratório e base de fogueira.
Abra `index.html` pelo Live Server. `1`: câmera automática; `2`: câmera manual
(arraste para girar). Use o scroll para zoom nas duas e `L` para alternar a iluminação Blinn-Phong.
`M` pausa/retoma o passeio; `R` reinicia o Slowpoke. As rotas são internas, sem estradas visíveis.
O passeio atual usa os patamares planos da areia, desviando dos objetos e da água.
`P` alterna: em pé, dormindo deitado, deitado com olhos e boca abertos e cauda na água.
Em Comandos, escolha caminhar até a pose ou teletransportar para vê-la imediatamente.
Outro `P` troca a pose; `M` sai da pose e retoma o passeio.

## Créditos

- Geometrias do cenário e texturas pixeladas: criadas no projeto, inspiradas no estilo Minecraft.
- [TWGL.js 7.0.0](https://github.com/greggman/twgl.js), Gregg Tavares — [MIT](https://opensource.org/license/mit). Avisos preservados na biblioteca.
- Modelo, textura e animação do Slowpoke: equipe [Cobblemon](https://gitlab.com/cable-mc/cobblemon), versão 1.7.3 — [licença dos recursos](https://gitlab.com/cable-mc/cobblemon-assets/-/blob/master/LICENSE). Animação adaptada para este projeto.
