attribute vec4 position;
attribute vec2 texcoord;
attribute float depth;

uniform mat4 u_world;
uniform mat4 u_viewProjection;
uniform mediump float u_time;
uniform float u_extent;

varying mediump vec3 v_worldPosition;
varying mediump vec3 v_normal;
varying mediump vec2 v_uv;
varying mediump float v_depth;

void main() {
  vec4 worldPosition = u_world * position;
  float edge = min(u_extent - abs(worldPosition.x), u_extent - abs(worldPosition.z));
  float fade = smoothstep(0.0, 0.65, edge) * clamp(depth / 0.9, 0.0, 1.0);
  float phaseA = worldPosition.x * 0.9 + worldPosition.z * 0.35 + u_time * 1.3;
  float phaseB = worldPosition.z * 0.8 - worldPosition.x * 0.25 - u_time * 0.9;
  worldPosition.y += fade * (sin(phaseA) * 0.024 + cos(phaseB) * 0.012);

  float dx = fade * (cos(phaseA) * 0.0216 + sin(phaseB) * 0.003);
  float dz = fade * (cos(phaseA) * 0.0084 - sin(phaseB) * 0.0096);
  v_normal = normalize(vec3(-dx, 1.0, -dz));
  v_worldPosition = worldPosition.xyz;
  v_uv = texcoord;
  v_depth = depth;
  gl_Position = u_viewProjection * worldPosition;
}
