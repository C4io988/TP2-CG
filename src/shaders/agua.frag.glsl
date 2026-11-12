precision mediump float;

uniform sampler2D u_texture;
uniform mediump float u_time;
uniform mediump float u_extent;
uniform mediump float u_ventoForca;
uniform mediump float u_ventoDeslocamento;
uniform mediump vec2 u_ventoDirecao;
uniform bool u_lightOn;
uniform vec3 u_cameraPosition;
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;
uniform vec3 u_material;
uniform float u_shininess;
uniform vec3 u_fogoPosicao;
uniform vec3 u_fogoCor;
uniform float u_fogoIntensidade;
uniform float u_fogoAlcance;
uniform bool u_neblinaAtiva;
uniform vec3 u_neblinaCor;
uniform float u_neblinaInicio;
uniform float u_neblinaFim;

varying mediump vec3 v_worldPosition;
varying mediump vec3 v_normal;
varying mediump vec2 v_uv;
varying mediump float v_depth;

void main() {
  // Deslocamento visível mesmo na câmera geral, preservando os pixels da textura.
  vec2 deslocamento = u_ventoDirecao * (u_time + u_ventoDeslocamento) * 0.045;
  vec3 patternA = texture2D(u_texture, v_uv - deslocamento).rgb;
  vec3 patternB = texture2D(u_texture, v_uv - deslocamento * 0.55
    + vec2(-u_ventoDirecao.y, u_ventoDirecao.x) * u_time * 0.022).rgb;
  // Recupera o contraste da paleta: antes a mistura deixava a animação quase lisa.
  float detalhePixel = clamp((mix(patternA.b, patternB.b, 0.35) - 0.69) / 0.15, 0.0, 1.0);
  float detail = 0.76 + detalhePixel * 0.38;
  float deep = clamp((v_depth - 0.6) / 1.08, 0.0, 1.0);
  vec3 shallowColor = vec3(0.14, 0.47, 0.72);
  vec3 deepColor = vec3(0.045, 0.26, 0.56);
  vec3 color = mix(shallowColor, deepColor, deep) * detail;

  vec3 normal = normalize(v_normal);
  vec3 viewDirection = normalize(u_cameraPosition - v_worldPosition);
  float grazing = pow(1.0 - max(dot(normal, viewDirection), 0.0), 4.0);
  float alpha = mix(0.48, 0.68, deep) + grazing * 0.05;
  if (u_lightOn) {
    vec3 light = normalize(u_lightDirection);
    float diffuse = max(dot(normal, light), 0.0);
    vec3 directions = light + viewDirection;
    vec3 halfVector = directions / max(length(directions), 0.0001);
    float specular = diffuse > 0.0 ? pow(max(dot(normal, halfVector), 0.0), u_shininess) : 0.0;
    float borda = min(u_extent - abs(v_worldPosition.x), u_extent - abs(v_worldPosition.z));
    float atenuacao = smoothstep(0.0, 1.5, borda) * mix(0.35, 1.0, deep);
    float brilho = min(u_material.z * specular, 0.12) * atenuacao;
    color = color * (u_material.x * u_ambientColor + u_material.y * diffuse * u_lightColor)
      + brilho * u_lightColor;
    vec3 paraFogo = u_fogoPosicao - v_worldPosition;
    float distanciaFogo = length(paraFogo);
    vec3 direcaoFogo = paraFogo / max(distanciaFogo, 0.001);
    float atenuacaoFogo = pow(max(0.0, 1.0 - distanciaFogo / u_fogoAlcance), 2.0)
      / (1.0 + distanciaFogo * distanciaFogo * 0.18);
    color += color * u_fogoCor * u_fogoIntensidade * atenuacaoFogo
      * max(dot(normal, direcaoFogo), 0.0);
  }
  if (u_neblinaAtiva) {
    float neblina = smoothstep(u_neblinaInicio, u_neblinaFim,
      length(u_cameraPosition - v_worldPosition)) * 0.78;
    color = mix(color, u_neblinaCor, neblina);
  }
  gl_FragColor = vec4(color, alpha);
}
