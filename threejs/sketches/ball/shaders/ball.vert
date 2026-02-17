float simplexNoise(vec2 v);
float map(float value, float inMin, float inMax, float outMin, float outMax);
#pragma glslify: simplexNoise = require('../../shared/glsl/noise.glsl')
#pragma glslify: map = require('../../shared/glsl/util.glsl')

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform float uTime;
uniform float uBounceSpeed;
uniform float uBounceHeight;
uniform float uStretch;
uniform float uSquash;
uniform float uAir;

varying vec2 vUv;

void main() {
    // bounce less the less air there is in the ball
    //squash more the less air there is in the ball

    float bounceFactor = map(uAir, 0.0, 100.0, 0.0, 1.0);

    vec4 modelPos = vec4(position, 1.0);

    float bounce = abs(sin(uTime * uBounceSpeed)) * bounceFactor; // bounce more the more air there is in the ball

    float contactMask = 1.0 - smoothstep(0.0, 0.25, bounce);

    float bounceCos = abs(cos(uTime * uBounceSpeed));

    float squashAmount = uSquash * contactMask * (1.0 - bounceFactor);             // only at contact
    float stretchAmount = uStretch * bounceCos * (1.0 - contactMask);   // only in the air

    float scaleY = 1.0 - squashAmount + stretchAmount;

    float scaleXZ = inversesqrt(scaleY);

    modelPos.x *= scaleXZ;
    modelPos.z *= scaleXZ;
    modelPos.y *= scaleY;

    modelPos.y += 0.5 * scaleY; // keep the bottom of the ball at y=0

    modelPos.y += bounce * uBounceHeight; // bounce more the more air there is in the ball

    float noise = simplexNoise(normal.xy * 0.75 + uTime * 0.1);
    float noiseStrength = map(uAir, 0.0, 100.0, 0.1, 0.0); // more noise the less air there is in the ball
    modelPos.xyz += noise * normal * noiseStrength;

        // modelPos.y += 0.5; // move the ball up to make room for the spike

        // modelPos.y *= 0.2;
        // modelPos.xz *= 1.8;

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * modelPos;

    vUv = uv;

}
