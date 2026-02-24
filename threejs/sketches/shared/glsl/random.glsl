// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) *
        43758.5453123);
}

float randomFromRange(vec2 st, float min, float max) {
    return min + (max - min) * random(st);
}

#pragma glslify: export(random)
