#pragma glslify: fbm = require('../../shared/glsl/noise/fbm.glsl')

uniform sampler2D uTexBrushData;

uniform vec2 uResolution;

varying vec3 vViewPosition;
varying vec3 vViewNormal;
varying vec3 vViewLightDir;
varying vec2 vUv;
varying float vWetness;
varying float vHeight;
varying float vResidue;
varying float vDilution;

float heightAt(vec2 uv, float height, float wetness, float residue) {
    float n = fbm(uv * 1.0 + vec2(clamp(height, 0.0, 1.0) * 0.3));
    // n = clamp(n, 0.0, 1.0);
    n = pow(n, 1.3);
    wetness = max(wetness, 0.2);
    float smoothAmp = 0.8 * height * wetness;
    float textureAmp = residue * 0.5;
    float canvasGrain = fbm(uv * 8.0) * 0.05;
    return (smoothAmp + textureAmp) * n;
}

vec3 getNormal(float h, float extent, float wetness, float residue) {
    float e = 0.002;
    float hx = heightAt(uv + vec2(e, 0.0), extent, wetness, residue);
    float hy = heightAt(uv + vec2(0.0, e), extent, wetness, residue);

    float normalScale = 1.0;

    vec3 dx = vec3(normalScale, 0.0, (hx - h) / e);
    vec3 dy = vec3(0.0, normalScale, (hy - h) / e);

    return normalize(cross(dx, dy));
}
void main() {
    vec4 modelPos = vec4(position, 1.0);
    vec4 brushData = texture2D(uTexBrushData, uv);
    float residue = brushData.x;
    float height = brushData.z;
    float wetness = brushData.w;

    float h = heightAt(uv, height, wetness, residue);
    // modelPos.z += h * 0.1;

    vec4 worldPos = modelMatrix * modelPos;
    vec4 viewPos = viewMatrix * worldPos;

    gl_Position = projectionMatrix * viewPos;

    vec3 norm = getNormal(h, height, wetness, residue);
    vViewNormal = normalize(normalMatrix * norm);

    vec3 worldLightDir = normalize(vec3(0.0, 1.0, 1.0));
    vViewLightDir = normalize((viewMatrix * vec4(worldLightDir, 0.0)).xyz);

    vViewPosition = viewPos.xyz;
    vUv = uv;
    vWetness = wetness;
    vHeight = height;
    vResidue = residue;
    vDilution = brushData.y;

}
