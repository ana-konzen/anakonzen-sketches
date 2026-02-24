float map(float value, float inMin, float inMax, float outMin, float outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

vec3 rgb(float r, float g, float b) {
    return vec3(r, g, b) / 255.0;
}

#pragma glslify: export(map)
