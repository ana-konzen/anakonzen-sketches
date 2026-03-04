uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
    vec4 modelPos = vec4(position, 1.0);
    modelPos.xyz *= 2.0;

    vUv = uv;

    gl_Position = modelPos;
}
