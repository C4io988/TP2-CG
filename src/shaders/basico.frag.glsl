precision mediump float;

uniform vec3 u_color;
uniform sampler2D u_texture;
uniform bool u_useTexture;
uniform bool u_lightOn;
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;
uniform vec3 u_cameraPosition;
uniform vec3 u_material;
uniform float u_shininess;
uniform float u_brilhoEvolucao;
uniform float u_emissao;
uniform vec3 u_fogoPosicao;
uniform vec3 u_fogoCor;
uniform float u_fogoIntensidade;
uniform float u_fogoAlcance;
uniform bool u_neblinaAtiva;
uniform vec3 u_neblinaCor;
uniform float u_neblinaInicio;
uniform float u_neblinaFim;

varying mediump vec3 v_normal;
varying mediump vec2 v_uv;
varying mediump vec3 v_worldPosition;

void main() {
  vec4 base = vec4(u_color, 1.0);
  if (u_useTexture) base *= texture2D(u_texture, v_uv);
  if (base.a < 0.1) discard;
  base.rgb = mix(base.rgb, vec3(1.0, 0.98, 0.85), u_brilhoEvolucao);
  vec3 cor = base.rgb;
  if (u_lightOn) {
    vec3 normal = normalize(v_normal);
    if (!gl_FrontFacing) normal = -normal;
    vec3 lightDirection = normalize(u_lightDirection);
    vec3 viewDirection = normalize(u_cameraPosition - v_worldPosition);
    // Blinn-Phong: vetor intermediário entre a direção da luz e a da câmera.
    vec3 sumDirections = lightDirection + viewDirection;
    vec3 halfVector = sumDirections / max(length(sumDirections), 0.0001);
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float specular = 0.0;
    if (diffuse > 0.0) {
      specular = pow(max(dot(normal, halfVector), 0.0), u_shininess);
    }

    vec3 ambientLight = u_material.x * u_ambientColor;
    vec3 diffuseLight = u_material.y * diffuse * u_lightColor;
    vec3 specularLight = u_material.z * specular * u_lightColor;
    cor = base.rgb * (ambientLight + diffuseLight) + specularLight;
    vec3 paraFogo = u_fogoPosicao - v_worldPosition;
    float distanciaFogo = length(paraFogo);
    vec3 direcaoFogo = paraFogo / max(distanciaFogo, 0.001);
    float atenuacaoFogo = pow(max(0.0, 1.0 - distanciaFogo / u_fogoAlcance), 2.0)
      / (1.0 + distanciaFogo * distanciaFogo * 0.18);
    float difusoFogo = max(dot(normal, direcaoFogo), 0.0);
    vec3 meioFogo = direcaoFogo + viewDirection;
    meioFogo /= max(length(meioFogo), 0.001);
    float especularFogo = difusoFogo > 0.0 ? pow(max(dot(normal, meioFogo), 0.0), u_shininess) : 0.0;
    cor += (base.rgb * u_material.y * difusoFogo + u_material.z * especularFogo)
      * u_fogoCor * u_fogoIntensidade * atenuacaoFogo;
  }
  cor = mix(cor, base.rgb, u_emissao);
  cor = mix(cor, vec3(1.0, 0.98, 0.85), u_brilhoEvolucao);
  if (u_neblinaAtiva) {
    float distancia = length(u_cameraPosition - v_worldPosition);
    float neblina = smoothstep(u_neblinaInicio, u_neblinaFim, distancia) * 0.78;
    cor = mix(cor, u_neblinaCor, neblina);
  }
  gl_FragColor = vec4(cor, base.a);
}
