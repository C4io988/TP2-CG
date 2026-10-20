# Paraíso Pokémon

Projeto de Computação Gráfica com JavaScript, WebGL e TWGL.js.

## Etapa atual

Base inicial: hemisfério branco inferior, faixa escura e um disco plano provisório
para receber o cenário. A base tem raio de 16 unidades, sem tampa nem botão.
A página exibe apenas a base, sem títulos ou legendas.

Arraste sobre a cena para girar a câmera e use a roda do mouse para aproximar.

## Como abrir

Sirva esta pasta por HTTP com um servidor estático, como a extensão Live Server
do VS Code, e abra `index.html` pelo endereço local. Os módulos não devem ser
abertos diretamente pelo protocolo `file://`.

## Organização

- `src/main.js`: inicialização, câmera e desenho.
- `src/base.js`: geometrias da plataforma e dimensões de referência.
- `src/shaders/basico.js`: iluminação difusa simples para esta primeira etapa.
- `assets/`: recursos que serão adicionados nas próximas etapas.
- `vendor/`: dependências locais.
- `docs/`: documentação e futuras capturas da cena.

## Créditos

TWGL.js 7.0.0, de Gregg Tavares, sob licença MIT, incluída em
`vendor/TWGL-LICENSE.md`. Geometria da plataforma composta no próprio projeto.
