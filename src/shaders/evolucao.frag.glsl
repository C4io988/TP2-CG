precision mediump float;
uniform vec3 u_cor;
uniform float u_opacidade;
uniform bool u_neblinaAtiva;
uniform vec3 u_neblinaCor;
uniform float u_neblinaInicio;
uniform float u_neblinaFim;
varying mediump float v_distancia;
void main() {
  float neblina = u_neblinaAtiva ? smoothstep(u_neblinaInicio, u_neblinaFim, v_distancia) * 0.78 : 0.0;
  gl_FragColor = vec4(mix(u_cor, u_neblinaCor, neblina), u_opacidade);
}
