#pragma glslify: fbm = require('../../shared/glsl/noise/fbm.glsl')

// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// uniform mat4 modelMatrix;

// attribute vec3 position;
// attribute vec2 uv;
attribute float extent;
attribute float dryness;
attribute vec3 brushColor;
attribute float isPainted;

varying vec2 vUv;
varying float vExtent;
varying float vDryness;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec3 vViewNormal;
varying vec3 vBrushColor;
varying float vIsPainted;
varying vec3 vViewLightDir;

uniform float normalScale;

// height function in uv space, got this w/ trial and error + chatgpt
float heightAt(vec2 uv) {
    float n = fbm(uv * 3.0 + vec2(extent * 0.3));
  // n = (n - 0.5) * 2.0;
    n = clamp(n, 0.0, 1.0);
    n = pow(n, 1.4);
    float amp = 0.1 * extent * (1.0 - dryness * 0.8);

    return n * amp;
}

void main() {
    vec4 modelPos = vec4(position, 1.0);
    float h = heightAt(uv);

    modelPos.z += h;

    float e = 0.002;
    float hx = heightAt(uv + vec2(e, 0.0));
    float hy = heightAt(uv + vec2(0.0, e));

    vec3 dx = vec3(normalScale, 0.0, (hx - h) / e);
    vec3 dy = vec3(0.0, normalScale, (hy - h) / e);

    vec3 nObj = normalize(cross(dx, dy));

    vec4 worldPos = modelMatrix * modelPos;
    vec4 viewPos = viewMatrix * worldPos;
    vViewNormal = normalize(normalMatrix * nObj);

    vec3 worldLightDir = normalize(vec3(0.0, 1.0, 1.0));
    vViewLightDir = normalize((viewMatrix * vec4(worldLightDir, 0.0)).xyz);
    vViewPosition = viewPos.xyz;
    vUv = uv;
    vExtent = extent;
    vDryness = dryness;
    vPosition = modelPos.xyz;
    vIsPainted = isPainted;

    gl_Position = projectionMatrix * viewPos;

    vBrushColor = brushColor;

}
