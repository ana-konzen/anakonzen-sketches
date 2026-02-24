precision mediump float;

varying vec2 vUv;
varying float vExtent;
varying float vDryness;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec3 vViewNormal;
varying vec3 vBrushColor;
varying float vIsPainted;
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

    float glossiness = 150.0 * (1.0 - vDryness * 0.8);
    float specStrength = 0.7 * (1.0 - vDryness * 0.8);

    float specular = pow(max(dot(normal, h), 0.0), glossiness) * specStrength;

    vec3 color = vBrushColor;
    color *= mix(1.0, lambert, vExtent);
    color += specular * vExtent;

    // vec3 color = vec3(blendAmt, 1.0, 1.0);

    gl_FragColor = vec4(color, vExtent);
}

// https://stackoverflow.com/questions/53950935/webgl-adding-specular-light-without-the-help-of-three-js