precision mediump float;

uniform sampler2D u_texture;
uniform mediump float u_time;
uniform bool u_lightOn;
uniform vec3 u_cameraPosition;
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;
uniform vec3 u_material;
uniform float u_shininess;

varying mediump vec3 v_worldPosition;
varying mediump vec3 v_normal;
varying mediump vec2 v_uv;
varying mediump float v_depth;

void main() {
  // Duas camadas pixeladas deslizam lentamente em direções diferentes.
  vec3 patternA = texture2D(u_texture, v_uv + vec2(u_time * 0.018, u_time * 0.008)).rgb;
  vec3 patternB = texture2D(u_texture, v_uv + vec2(-u_time * 0.009, u_time * 0.013)).rgb;
  float detail = 0.74 + (patternA.b + patternB.b) * 0.20;
  float deep = clamp((v_depth - 0.6) / 1.08, 0.0, 1.0);
  vec3 shallowColor = vec3(0.18, 0.55, 0.78);
  vec3 deepColor = vec3(0.045, 0.26, 0.56);
  vec3 color = mix(shallowColor, deepColor, deep) * detail;

  vec3 normal = normalize(v_normal);
  vec3 viewDirection = normalize(u_cameraPosition - v_worldPosition);
  float grazing = pow(1.0 - max(dot(normal, viewDirection), 0.0), 4.0);
  float alpha = mix(0.38, 0.65, deep) + grazing * 0.08;
  if (u_lightOn) {
    vec3 light = normalize(u_lightDirection);
    float diffuse = max(dot(normal, light), 0.0);
    vec3 directions = light + viewDirection;
    vec3 halfVector = directions / max(length(directions), 0.0001);
    float specular = diffuse > 0.0 ? pow(max(dot(normal, halfVector), 0.0), u_shininess) : 0.0;
    color = color * (u_material.x * u_ambientColor + u_material.y * diffuse * u_lightColor)
      + u_material.z * specular * u_lightColor;
  }
  gl_FragColor = vec4(color, alpha);
}
