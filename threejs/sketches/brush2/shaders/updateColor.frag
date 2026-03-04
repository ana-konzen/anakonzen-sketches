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
    vec4 brushData = texture2D(uTexBrushData, vUv);
    float wetness = brushData.w;
    float height = brushData.z;
    float residue = brushData.x;
    float paintPresence = smoothstep(0.0, 0.05, residue);

    // Color diffusion — wet paint spreads its pigment to neighbors
    vec2 px = 1.0 / uResolution;
    vec3 colorL = texture2D(uTexColors, vUv + vec2(-px.x, 0.0)).rgb;
    vec3 colorR = texture2D(uTexColors, vUv + vec2(px.x, 0.0)).rgb;
    vec3 colorU = texture2D(uTexColors, vUv + vec2(0.0, px.y)).rgb;
    vec3 colorD = texture2D(uTexColors, vUv + vec2(0.0, -px.y)).rgb;
    vec3 avgNeighbor = (colorL + colorR + colorU + colorD) / 4.0;

    float dilution = brushData.y;
    float diffusionRate = paintPresence * wetness * mix(0.1, 0.01, dilution) * uDeltaTime * 60.0;
    diffusionRate = min(diffusionRate, 0.25);
    // vec3 color = mix(baseColor, avgNeighbor, diffusionRate);
    vec3 color = baseColor;

    float mask = uMouseDown ? brushMask(vUv, uMousePos, uBrushRadius) : 0.0;
    // mask = max(mask, 0.0);

        // Color advection — smear color along brush movement
    vec2 advUv = vUv - uMouseVel * wetness * uSmearStrength * uDeltaTime;
    vec3 advectedColor = texture2D(uTexColors, advUv).rgb;
    float advectAmount = mask * wetness * uSmearStrength * uDeltaTime;
    color = mix(color, advectedColor, clamp(advectAmount, 0.0, 1.0));

    float blendFactor = mask * uBlendStrength * wetness * uDeltaTime * 60.0;
    blendFactor = clamp(blendFactor, 0.0, 1.0);

        // pre-compensate for spectral_mix's internal pow(factor, 2.0) on concentrations
    float mixFactor = sqrt(blendFactor);
    color = spectral_mix(color, uTargetColor, mixFactor);

    gl_FragColor = vec4(color, 1.0);
}
