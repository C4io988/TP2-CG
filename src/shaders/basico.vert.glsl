attribute vec4 position;
attribute vec3 normal;
attribute vec2 texcoord;

uniform mat4 u_worldViewProjection;
uniform mat4 u_world;
uniform mat4 u_worldInverseTranspose;

varying vec3 v_normal;
varying vec2 v_uv;
varying vec3 v_worldPosition;

void main() {
  gl_Position = u_worldViewProjection * position;
  v_normal = mat3(u_worldInverseTranspose) * normal;
  v_uv = texcoord;
  v_worldPosition = (u_world * position).xyz;
}
