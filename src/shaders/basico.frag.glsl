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

varying vec3 v_normal;
varying vec2 v_uv;
varying vec3 v_worldPosition;

void main() {
  vec4 base = vec4(u_color, 1.0);
  if (u_useTexture) base *= texture2D(u_texture, v_uv);
  if (base.a < 0.1) discard;
  if (!u_lightOn) {
    gl_FragColor = base;
    return;
  }

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
  gl_FragColor = vec4(base.rgb * (ambientLight + diffuseLight) + specularLight, base.a);
}
