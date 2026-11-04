// Coeficientes ambiente, difuso e especular; expoente controla a concentração do brilho.
export const MATERIAIS = {
  base: { u_material: [0.35, 0.65, 0.22], u_shininess: 48 },
  borda: { u_material: [0.35, 0.65, 0.08], u_shininess: 40 },
  areia: { u_material: [0.38, 0.62, 0.035], u_shininess: 12 },
  agua: { u_material: [0.32, 0.68, 0.45], u_shininess: 80 },
  slowpoke: { u_material: [0.38, 0.62, 0.065], u_shininess: 24 },
};
