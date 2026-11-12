attribute vec4 position;
attribute vec2 texcoord;
attribute float depth;

uniform mat4 u_world;
uniform mat4 u_viewProjection;
uniform mediump float u_time;
uniform mediump float u_extent;
uniform mediump float u_ventoForca;
uniform mediump float u_ventoDeslocamento;
uniform mediump vec2 u_ventoDirecao;

varying mediump vec3 v_worldPosition;
varying mediump vec3 v_normal;
varying mediump vec2 v_uv;
varying mediump float v_depth;

void main() {
  vec4 worldPosition = u_world * position;
  float edge = min(u_extent - abs(worldPosition.x), u_extent - abs(worldPosition.z));
  float fade = smoothstep(0.0, 0.65, edge) * clamp(depth / 0.9, 0.0, 1.0);
  vec2 transversal = vec2(-u_ventoDirecao.y, u_ventoDirecao.x);
  float phaseA = dot(worldPosition.xz, u_ventoDirecao) * 0.85 - u_time * 1.6 - u_ventoDeslocamento * 0.45;
  float phaseB = dot(worldPosition.xz, transversal) * 1.15 + u_time * 1.1 + u_ventoDeslocamento * 0.2;
  float amplitudeA = 0.095 + u_ventoForca * 0.035;
  float amplitudeB = 0.035 + u_ventoForca * 0.015;
  worldPosition.y += fade * (sin(phaseA) * amplitudeA + cos(phaseB) * amplitudeB);

  vec2 gradiente = fade * (cos(phaseA) * amplitudeA * 0.85 * u_ventoDirecao
    - sin(phaseB) * amplitudeB * 1.15 * transversal);
  v_normal = normalize(vec3(-gradiente.x, 1.0, -gradiente.y));
  v_worldPosition = worldPosition.xyz;
  v_uv = texcoord;
  v_depth = depth;
  gl_Position = u_viewProjection * worldPosition;
}
