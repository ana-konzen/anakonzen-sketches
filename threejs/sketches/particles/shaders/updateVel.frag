precision mediump float;

uniform sampler2D uTexPositions;
uniform sampler2D uTexVelocities;
uniform sampler2D uTexForces;

uniform vec3 uBoundsSize;
uniform float uDeltaTime;

varying vec2 vUv;

void updateVelocity(inout float vel, float pos, float bound) {
    if(pos < bound * -0.5) {
        vel = abs(vel);
    }
    if(pos > bound * 0.5) {
        vel = abs(vel) * -1.0;
    }
}

void main() {
    vec3 pos = texture2D(uTexPositions, vUv).xyz;
    vec3 vel = texture2D(uTexVelocities, vUv).xyz;
    vec3 force = texture2D(uTexForces, vUv).xyz;

    // Update the velocity with the force.
    vel += force * uDeltaTime;

    // damp
    vel *= 0.98;

    // Calculate the next position without updating it to see if it collides with the volume bounds.
    pos += vel * uDeltaTime;

    // If there's a collision, change the velocity course.
    updateVelocity(vel.x, pos.x, uBoundsSize.x);

    updateVelocity(vel.y, pos.y, uBoundsSize.y);

    updateVelocity(vel.z, pos.z, uBoundsSize.z);

    // Save the new velocity.
    gl_FragColor = vec4(vel, 1.0);
}
