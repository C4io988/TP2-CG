attribute vec4 position;
uniform mat4 u_worldViewProjection;
uniform mat4 u_world;
uniform vec3 u_cameraPosition;
varying mediump float v_distancia;
void main() {
  gl_Position = u_worldViewProjection * position;
  v_distancia = length(u_cameraPosition - (u_world * position).xyz);
}
