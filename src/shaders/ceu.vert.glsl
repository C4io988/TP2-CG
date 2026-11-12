attribute vec2 position;
uniform mat4 u_inversaViewProjection;
uniform vec3 u_cameraPosition;
varying mediump vec3 v_direcao;

void main() {
  vec4 mundo = u_inversaViewProjection * vec4(position, 1.0, 1.0);
  v_direcao = mundo.xyz / mundo.w - u_cameraPosition;
  gl_Position = vec4(position, 1.0, 1.0);
}
