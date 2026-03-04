precision mediump float;

#pragma glslify: map = require('../../shared/glsl/util.glsl')
#pragma glslify: spectral_mix = require('../../shared/glsl/spectral.glsl')

uniform sampler2D uTexExtents;
uniform sampler2D uTexColors;
uniform vec3 uTargetColor;

uniform vec2 uMousePos;
uniform bool uMouseDown;

varying vec2 vUv;

void main() {
    vec3 baseColor = texture2D(uTexColors, vUv).rgb;
    vec3 newColor = baseColor;

    if(!uMouseDown) {
        gl_FragColor = vec4(baseColor, 1.0);
        return;
    }

    float extent = texture2D(uTexExtents, vUv).x;
    float oldExtent = texture2D(uTexExtents, vUv).y;

    float radius = 0.1;

    float dist = distance(vUv, uMousePos);

    if(dist < radius) {
        newColor = uTargetColor;
    }

    float extentRatio = oldExtent > 0.0 ? extent / oldExtent : 2.0;
    float extentMultiplier = atan(tan(0.5) * extentRatio);
    float mixMax = 0.75;

    float baseMix = mixMax * (1.0 - extentMultiplier);
    float newMix = (1.0 - mixMax) * extentMultiplier;

    vec3 color = spectral_mix(baseColor, baseMix, newColor, newMix);

    // Save the new color.
    gl_FragColor = vec4(color, 1.0);
}