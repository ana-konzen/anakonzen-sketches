precision mediump float;

uniform sampler2D uTexPositions;
uniform sampler2D uTexForces;

uniform float uDeltaTime;

uniform vec2 uMousePos;

varying vec2 vUv;

void main() {
    vec3 pos = texture2D(uTexPositions, vUv).xyz;
    vec3 force = texture2D(uTexForces, vUv).xyz;

    vec3 center = vec3(1.0, 0.5, 0.0);

    vec3 mousePos3D = vec3(uMousePos, 0.0);

    vec3 target = center;

    // Calculate the direction from the particle to the target (mouse position).
    vec3 dirToTarget = normalize(target - pos);

    // Calculate a simple force that attracts the particle to the target.
    vec3 attractionForce = dirToTarget * 0.01;

    // Update the force with the attraction force.
    force += attractionForce;

    // Save the new force.
    gl_FragColor = vec4(force, 1.0);
}
