precision mediump float;

#pragma glslify: map = require('../../shared/glsl/util.glsl')
#pragma glslify: spectral_mix = require('../../shared/glsl/spectral.glsl')

uniform sampler2D uTexBrushData;
uniform sampler2D uTexColors;
uniform vec3 uTargetColor;

uniform vec2 uMousePos;
uniform bool uMouseDown;
uniform float uBrushRadius;
uniform float uDeltaTime;
uniform float uBlendStrength;
uniform vec2 uResolution;
uniform vec2 uMouseVel;
uniform float uSmearStrength;

varying vec2 vUv;

float gaussian_weight(float x, float sigma) {
    return exp(-pow(x, 2.0) / (2.0 * sigma));
}

float brushMask(vec2 uv, vec2 center, float radius) {
    float dist = length(uv - center) / (radius);
    return gaussian_weight(dist, radius / 1.0) - 0.5 * gaussian_weight(dist, radius / 3.0);
}

void main() {
    vec3 baseColor = texture2D(uTexColors, vUv).rgb;
    float wetness = texture2D(uTexBrushData, vUv).w;

    // Color diffusion — wet paint spreads its pigment to neighbors
    vec2 px = 1.0 / uResolution;
    vec3 colorL = texture2D(uTexColors, vUv + vec2(-px.x, 0.0)).rgb;
    vec3 colorR = texture2D(uTexColors, vUv + vec2(px.x, 0.0)).rgb;
    vec3 colorU = texture2D(uTexColors, vUv + vec2(0.0, px.y)).rgb;
    vec3 colorD = texture2D(uTexColors, vUv + vec2(0.0, -px.y)).rgb;
    vec3 avgNeighbor = (colorL + colorR + colorU + colorD) / 4.0;

    float diffusionRate = wetness * 0.05 * uDeltaTime * 60.0;
    diffusionRate = min(diffusionRate, 0.25);
    vec3 color = mix(baseColor, avgNeighbor, diffusionRate);

    // Brush interaction — only when painting
    if(uMouseDown) {
        float mask = brushMask(vUv, uMousePos, uBrushRadius);
        mask = max(mask, 0.0);

        // Color advection — smear color along brush movement
        vec2 advUv = vUv - uMouseVel * wetness * uSmearStrength * uDeltaTime;
        vec3 advectedColor = texture2D(uTexColors, advUv).rgb;
        float advectAmount = mask * wetness * uSmearStrength * uDeltaTime;
        color = mix(color, advectedColor, clamp(advectAmount, 0.0, 1.0));

        // Color blend — gated by wetness
        float blendFactor = mask * uBlendStrength * wetness * uDeltaTime * 60.0;
        blendFactor = clamp(blendFactor, 0.0, 1.0);

        // Pre-compensate for spectral_mix's internal pow(factor, 2.0) on concentrations
        float mixFactor = sqrt(blendFactor);
        color = spectral_mix(color, uTargetColor, mixFactor);
    }

    gl_FragColor = vec4(color, 1.0);
}
