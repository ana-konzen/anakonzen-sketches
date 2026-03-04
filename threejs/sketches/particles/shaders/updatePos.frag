precision mediump float;

uniform sampler2D uTexPositions;
uniform sampler2D uTexVelocities;

uniform float uDeltaTime;

varying vec2 vUv;

void main() {
    vec3 pos = texture2D(uTexPositions, vUv).xyz;
    vec3 vel = texture2D(uTexVelocities, vUv).xyz;

    // Update the position with the velocity.
    pos += vel * uDeltaTime;

    // Save the new position.
    gl_FragColor = vec4(pos, 1.0);
}