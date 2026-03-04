precision mediump float;

#pragma glslify: map = require('../../shared/glsl/util.glsl')
#pragma glslify: fbm = require('../../shared/glsl/noise/fbm.glsl')
#pragma glslify: random = require('../../shared/glsl/random.glsl')

uniform sampler2D uTexExtents;

uniform vec2 uMousePos;
uniform bool uMouseDown;
uniform vec2 uMouseVel;
uniform float uDeltaTime;
uniform vec2 uResolution;

uniform int uAxis;

varying vec2 vUv;

float gaussian_weight(float x, float sigma) {
    return exp(-pow(x, 2.0) / (2.0 * sigma));
}

float brushMask(vec2 uv, vec2 center, float radius) {
    float dist = length(uv - center) / (radius);
    return gaussian_weight(dist, radius / 1.0) - 0.5 * gaussian_weight(dist, radius / 3.0);
    // return dist < 1.0 ? 1.0 : 0.0;
}

float gaussianBlur(float value, float sigma, int axis) {
    vec2 px = 1.0 / uResolution;
    float blurred_value = 0.0;
    float dist = 0.0;
    vec2 point = vec2(0.0, 0.0);
    const int radius = 5;
    float weight_sum = 0.0;
    for(int i = -radius; i <= radius; i++) {
        if(axis == 0) {
            // Doing horizontal blur
            dist = float(i) * px.x;
            point = vec2(dist, 0.0);
        } else if(axis == 1) {
            // Doing vertical blur
            dist = float(i) * px.y;
            point = vec2(0.0, dist);
        }
        blurred_value += gaussian_weight(dist, sigma) * texture2D(uTexExtents, vUv + point).z;
        weight_sum += gaussian_weight(dist, sigma);
    }
    return blurred_value / weight_sum;
}

void main() {
    vec4 brushData = texture2D(uTexExtents, vUv);
    float wetness = brushData.w;
    float height = brushData.z;
    float extent = brushData.x;
    float radius = 0.1;
    float stamp = uMouseDown ? brushMask(vUv, uMousePos, radius) : 0.0;

    // Diffusion
    vec2 px = 1.0 / uResolution;
    float dx = uAxis == 0 ? px.x : px.y;
    float viscosity = 0.001;
    float diffConst = 1.0;
    float blur_height = gaussianBlur(height, pow(dx, 2.0) / uDeltaTime * viscosity * wetness * diffConst, uAxis);

    // Advection
    float smearStrength = 1.;
    vec2 advUv = vUv - uMouseVel * wetness * smearStrength * uDeltaTime; // advect the UV coordinates based on the velocity and wetness
    float advHeight = texture2D(uTexExtents, advUv).z; // sample the height from the advected UVs
    blur_height += wetness * stamp * smearStrength * (height - advHeight);

    // Exponential decay
    float decaySpeed = 0.05;
    blur_height -= decaySpeed * height * uDeltaTime;

    // Source of paint
    float loadSpeed = 2.0;
    float deposit = loadSpeed * stamp;
    blur_height += deposit * uDeltaTime;
    blur_height = max(blur_height, 0.0);

    // Wetness updates
    float wetAdd = 1.0;
    float dryingSpeed = 0.01;
    float new_wetness = gaussianBlur(wetness, pow(dx, 2.0) / uDeltaTime * viscosity * wetness * diffConst, uAxis);
    new_wetness -= dryingSpeed * wetness * uDeltaTime;
    new_wetness += wetAdd * stamp * uDeltaTime;
    new_wetness = clamp(new_wetness, 0.1, 1.0);

    extent += deposit * uDeltaTime * 5.0; // The extent grows faster than the height to create a more pronounced effect.
    extent = clamp(extent, 0.0, 1.0);

    // Save the new extent.
    gl_FragColor = vec4(extent, 0.0, blur_height, new_wetness);
}