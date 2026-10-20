export const vertexShader = `
  attribute vec4 position;
  attribute vec3 normal;
  attribute vec2 texcoord;
  uniform mat4 u_worldViewProjection;
  uniform mat4 u_worldInverseTranspose;
  varying vec3 v_normal;
  varying vec2 v_uv;

  void main() {
    gl_Position = u_worldViewProjection * position;
    v_normal = mat3(u_worldInverseTranspose) * normal;
    v_uv = texcoord;
  }
`;

export const fragmentShader = `
  precision mediump float;
  uniform vec3 u_color;
  uniform sampler2D u_texture;
  uniform bool u_useTexture;
  varying vec3 v_normal;
  varying vec2 v_uv;

  void main() {
    vec3 lightDirection = normalize(vec3(-0.5, 1.0, 0.8));
    vec4 base = vec4(u_color, 1.0);
    if (u_useTexture) base *= texture2D(u_texture, v_uv);
    if (base.a < 0.1) discard;
    vec3 normal = normalize(v_normal);
    if (!gl_FrontFacing) normal = -normal;
    float diffuse = max(dot(normal, lightDirection), 0.0);
    gl_FragColor = vec4(base.rgb * (0.45 + 0.55 * diffuse), 1.0);
  }
`;
