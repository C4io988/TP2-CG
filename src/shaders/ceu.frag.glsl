precision mediump float;
uniform samplerCube u_ceu;
uniform float u_noite;
uniform float u_tempo;
varying mediump vec3 v_direcao;

float aleatorio(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 d = normalize(v_direcao);
  vec3 dia = textureCube(u_ceu, d).rgb;
  vec3 noite = mix(vec3(0.035, 0.055, 0.13), vec3(0.006, 0.012, 0.04),
    smoothstep(-0.65, 0.8, d.y));
  // Uma grade tridimensional de direções mantém as estrelas fixas no céu,
  // sem emendas de longitude ou movimento ao aproximar a câmera.
  vec3 grade = d * 95.0;
  vec3 celula = floor(grade);
  float semente = aleatorio(celula);
  vec3 centro = vec3(aleatorio(celula + 3.1), aleatorio(celula + 7.7), aleatorio(celula + 13.3));
  float estrela = (1.0 - smoothstep(0.08, 0.21, length(fract(grade) - centro)))
    * step(0.78, semente);
  float brilho = 0.75 + 0.25 * sin(u_tempo * 1.4 + semente * 30.0);
  noite += estrela * brilho * vec3(0.72, 0.82, 1.0);

  // Disco lunar e halo suave no fundo do diorama.
  vec3 lua = normalize(vec3(-0.55, -0.30, -0.78));
  float distancia = length(d - lua);
  float disco = 1.0 - smoothstep(0.069, 0.073, distancia);
  float halo = exp(-distancia * 22.0) * 0.18;
  vec3 direita = normalize(cross(lua, vec3(0.0, 1.0, 0.0)));
  vec3 acima = cross(direita, lua);
  vec2 uv = vec2(dot(d, direita), dot(d, acima)) / 0.07;
  float crateras = (1.0 - smoothstep(0.10, 0.23, length(uv - vec2(-0.3, 0.25))))
    + (1.0 - smoothstep(0.13, 0.30, length(uv - vec2(0.32, -0.23))))
    + (1.0 - smoothstep(0.06, 0.15, length(uv - vec2(-0.25, -0.40))));
  noite += halo * vec3(0.45, 0.56, 0.9);
  noite = mix(noite, vec3(0.86, 0.90, 1.0) - crateras * 0.14, disco);
  gl_FragColor = vec4(mix(dia, noite, u_noite), 1.0);
}
