precision mediump float;

#pragma glslify: spectral_mix = require('../../shared/glsl/spectral.glsl')

varying vec2 vUv;
varying float vWetness;
varying float vHeight;
varying float vExtent;

varying vec3 vViewPosition;
varying vec3 vViewNormal;
varying vec3 vViewLightDir;

void main() {
    vec3 lightDir = normalize(vViewLightDir);

    vec3 normal = normalize(vViewNormal);
    vec3 viewDir = normalize(-vViewPosition);
    float diffuse = max(dot(normal, lightDir), 0.0);

    float ambient = 0.5;

    // Blinn-Phong spec
    vec3 h = normalize(lightDir + viewDir);
    float lambert = ambient + (1.0 - ambient) * diffuse;

    float glossiness = 220.0;
    float specStrength = 0.7;

    float specular = pow(max(dot(normal, h), 0.0), glossiness) * specStrength;

    vec3 blue = vec3(0.6, 0.6, 1.0);
    vec3 brushColor = blue;

    vec3 baseColor = vec3(1.0, 0.9, 0.8);

    float h01 = 1.0 - exp(-vHeight * 2.0); // tune 0.3..2

    float opacity = clamp(vExtent * (vWetness + 0.8), 0.0, 1.0);

    vec3 color = mix(baseColor, brushColor, h01);

    color *= mix(1.0, lambert, vWetness);
    color += specular * vWetness;

    // color = vec3(vHeight);

    gl_FragColor = vec4(color, 1.0);
}