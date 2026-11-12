attribute vec4 position;
attribute vec3 normal;
attribute vec2 texcoord;

uniform mat4 u_worldViewProjection;
uniform mat4 u_viewProjection;
uniform mat4 u_world;
uniform mat4 u_worldInverseTranspose;
uniform float u_ventoTempo;
uniform float u_ventoForca;
uniform vec2 u_ventoDirecao;
uniform bool u_folha;
uniform vec3 u_folhaOrigem;
uniform float u_folhaAlcance;
uniform float u_folhaIntensidade;

varying mediump vec3 v_normal;
varying mediump vec2 v_uv;
varying mediump vec3 v_worldPosition;

void main() {
  vec4 ponto = u_world * position;
  vec3 n = mat3(u_worldInverseTranspose) * normal;
  vec3 deslocamento = vec3(0.0);
  if (u_folha) {
    vec2 radial = ponto.xz - u_folhaOrigem.xz;
    float distancia = length(radial);
    float alcance = max(u_folhaAlcance, 0.01);
    float peso = clamp(distancia / alcance, 0.0, 1.0);
    float fase = dot(ponto.xz, u_ventoDirecao) * 0.7 - u_ventoTempo * 1.8;
    float ondulacao = sin(fase) + sin(fase * 1.7 + u_folhaOrigem.x) * 0.35;
    float amplitude = 0.25 * u_ventoForca * u_folhaIntensidade;
    vec3 direcao = vec3(u_ventoDirecao.x, 0.35, u_ventoDirecao.y);
    deslocamento = direcao * amplitude * peso * peso * ondulacao;
    // Normal corrigida pela derivada da deformação, mantendo o brilho nas folhas.
    vec2 derivadaPeso = distancia < alcance ? radial / max(distancia, 0.001) / alcance : vec2(0.0);
    vec2 derivada = amplitude * (2.0 * peso * derivadaPeso * ondulacao
      + peso * peso * (cos(fase) + cos(fase * 1.7 + u_folhaOrigem.x) * 0.595) * u_ventoDirecao * 0.7);
    vec3 gradiente = vec3(derivada.x, 0.0, derivada.y);
    n -= gradiente * dot(direcao, n) / max(0.5, 1.0 + dot(gradiente, direcao));
  }
  // O deslocamento está em coordenadas do mundo: w=0 não adiciona translação.
  gl_Position = u_worldViewProjection * position + u_viewProjection * vec4(deslocamento, 0.0);
  v_normal = n;
  v_uv = texcoord;
  v_worldPosition = ponto.xyz + deslocamento;
}
