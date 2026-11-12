precision mediump float;
uniform samplerCube u_ceu;
varying mediump vec3 v_direcao;

void main() {
  gl_FragColor = textureCube(u_ceu, v_direcao);
}
