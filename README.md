# Paraíso Pokémon

Trabalho de Computação Gráfica em JavaScript, WebGL e TWGL.js.
Shaders GLSL em `src/shaders/`, separados em vertex e fragment shader.

Por enquanto: ilha e relevo em blocos, Slowpoke passeando e Shellder nadando no mar.
Água pixelada com transparência, fundo em degraus, ondas suaves e textura animada.
Vento nas folhas, no catavento e na água. `N` mostra/esconde a neblina.
Coqueiros, vegetação, pedras, cocos, conchas, guarda-sol, catavento giratório e base de fogueira.
Abra `index.html` pelo Live Server. `1`: câmera automática; `2`: câmera manual
(arraste para girar). Use o scroll para zoom nas duas e `L` para alternar a iluminação Blinn-Phong.
`M` pausa/retoma os passeios; `R` reinicia os personagens. As rotas são internas, sem estradas visíveis.
O passeio atual usa os patamares planos da areia, desviando dos objetos e da água.
`P` alterna: em pé, dormindo deitado, deitado com olhos e boca abertos e cauda na água.
Em Comandos, escolha caminhar até a pose ou teletransportar para vê-la imediatamente.
Outro `P` troca a pose; `M` sai da pose e retoma o passeio.
Na quarta pose, após 5 segundos, Shellder se aproxima e morde a cauda.
Depois da mordida, brilho e partículas revelam Slowbro, que retorna à areia e passeia.
`P` e `M` ficam bloqueados durante a mordida/evolução; `R` funciona sempre.
Slowbro tem uma postura padrão; `M` controla seu passeio e `R` restaura os dois Pokémon separados.
A cena não reproduz sons. Para escutar os arquivos separados, abra [ouvir.html](assets/sons-para-ouvir/ouvir.html).

## Créditos

- Geometrias do cenário e texturas pixeladas: criadas no projeto, inspiradas no estilo Minecraft.
- [TWGL.js 7.0.0](https://github.com/greggman/twgl.js), Gregg Tavares — [MIT](https://opensource.org/license/mit). Avisos preservados na biblioteca.
- Modelos, texturas, animações e sons de Slowpoke, Shellder e Slowbro: equipe [Cobblemon](https://gitlab.com/cable-mc/cobblemon), versão 1.7.3 — [licença dos recursos](https://gitlab.com/cable-mc/cobblemon-assets/-/blob/master/LICENSE). Animações adaptadas para este projeto; sons separados apenas para escuta.
