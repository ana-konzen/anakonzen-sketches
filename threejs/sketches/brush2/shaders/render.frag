precision mediump float;

#pragma glslify: spectral_mix = require('../../shared/glsl/spectral.glsl')

varying vec2 vUv;
varying float vWetness;
varying float vHeight;
varying float vResidue;

varying vec3 vViewPosition;
varying vec3 vViewNormal;
varying vec3 vViewLightDir;

varying float vDilution;

uniform sampler2D uTexColors;

void main() {
    vec3 lightDir = normalize(vViewLightDir);

    vec3 normal = normalize(vViewNormal);
    vec3 viewDir = normalize(-vViewPosition);
    float diffuse = max(dot(normal, lightDir), 0.0);

    float ambient = 0.5;

    // Blinn-Phong spec
    vec3 h = normalize(lightDir + viewDir);
    float lambert = ambient + (1.0 - ambient) * diffuse;

    float glossiness = 80.0;
    float specStrength = 0.5;

    float specular = pow(max(dot(normal, h), 0.0), glossiness) * specStrength;

    vec3 brushColor = texture2D(uTexColors, vUv).rgb;

    brushColor *= mix(1.0, lambert, vWetness);
    float paintPresence = smoothstep(0.0, 0.05, max(vHeight, vResidue));
    float glossFactor = mix(0.0, 1.0, vWetness) * paintPresence;
    brushColor += specular * glossFactor;

    float opacityThreshold = mix(0.2, 0.02, vDilution);
    float opacity = smoothstep(0.0, opacityThreshold, vResidue);

    gl_FragColor = vec4(brushColor, opacity);
}