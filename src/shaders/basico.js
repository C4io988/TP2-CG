export const vertexShader = `
  attribute vec4 position;
  attribute vec3 normal;
  uniform mat4 u_worldViewProjection;
  uniform mat4 u_worldInverseTranspose;
  varying vec3 v_normal;

  void main() {
    gl_Position = u_worldViewProjection * position;
    v_normal = mat3(u_worldInverseTranspose) * normal;
  }
`;

export const fragmentShader = `
  precision mediump float;
  uniform vec3 u_color;
  varying vec3 v_normal;

  void main() {
    vec3 lightDirection = normalize(vec3(-0.5, 1.0, 0.8));
    float diffuse = max(dot(normalize(v_normal), lightDirection), 0.0);
    gl_FragColor = vec4(u_color * (0.45 + 0.55 * diffuse), 1.0);
  }
`;
