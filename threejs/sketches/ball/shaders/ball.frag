precision mediump float;

uniform sampler2D uTerrainMap;

varying vec2 vUv;

void main()
{
    vec4 texCol = texture2D(uTerrainMap, vUv);
    gl_FragColor = texCol;
}