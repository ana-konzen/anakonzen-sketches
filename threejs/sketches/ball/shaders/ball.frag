precision mediump float;

uniform sampler2D uTexMap;

varying vec2 vUv;

void main() {
    vec4 texCol = texture2D(uTexMap, vUv);
    gl_FragColor = texCol;
}