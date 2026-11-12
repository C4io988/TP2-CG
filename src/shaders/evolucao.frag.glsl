precision mediump float;
uniform vec3 u_cor;
uniform float u_opacidade;
void main() {
  gl_FragColor = vec4(u_cor, u_opacidade);
}
