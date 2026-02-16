float simplexNoise(vec2 v);
#pragma glslify: simplexNoise = require('../../shared/glsl/noise.glsl')

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform float uTime;
uniform float uNoiseScale;
uniform float uOffsetScale;

varying vec2 vUv;

void main() {
    vec4 modelPos = vec4(position, 1.0);

    float elevation = simplexNoise(normal.xz + uTime * uNoiseScale) * uOffsetScale;
    modelPos.xyz += normal * elevation;

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * modelPos;

    vUv = uv;
}
