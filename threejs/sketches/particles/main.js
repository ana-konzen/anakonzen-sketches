import * as THREE from "three";
import spectral from "spectral.js";
import GUI from "lil-gui";

import { lerp, map } from "../shared/js/util.js";
import { getDataTexture, getRenderBuffers } from "./buffers.js";
import {
  scene,
  camera,
  renderer,
  updateScene,
  resizeScene,
} from "./renderer.js";

const gui = new GUI();

export const size = 128;

const texPositions = getDataTexture(-2.0, 2.0);
const bufferPositions = getRenderBuffers();

const texVelocities = getDataTexture(-0.5, 0.5);
const bufferVelocities = getRenderBuffers();

const texForces = getDataTexture(0, 0);
const bufferForces = getRenderBuffers();

let srcIdx = 0;
let dstIdx = 1;

let firstRun = true;

// Create offscreen draw rectangle.
const planeGeo = new THREE.PlaneGeometry(1, 1, 1, 1);

const updateForceScene = new THREE.Scene();
import forceVert from "./shaders/update.vert";
import forceFrag from "./shaders/updateForce.frag";
const updateForceMat = new THREE.RawShaderMaterial({
  vertexShader: forceVert,
  fragmentShader: forceFrag,
  uniforms: {
    uTexPositions: { value: texPositions },
    uTexForces: { value: texForces },
    uMousePos: { value: [0.0, 0.0] },
    uDeltaTime: { value: 1 / 60.0 },
  },
});
const updateForceMesh = new THREE.Mesh(planeGeo, updateForceMat);
updateForceScene.add(updateForceMesh);

// Create offscreen scene for updating velocities.
const updateVelScene = new THREE.Scene();

// Create material and mesh for updating velocities.
import velVert from "./shaders/update.vert";
import velFrag from "./shaders/updateVel.frag";
const updateVelMat = new THREE.RawShaderMaterial({
  vertexShader: velVert,
  fragmentShader: velFrag,
  uniforms: {
    uTexPositions: { value: texPositions },
    uTexVelocities: { value: texVelocities },
    uTexForces: { value: texForces },
    uBoundsSize: { value: [6.0, 6.0, 6.0] },
    uDeltaTime: { value: 1 / 60.0 },
  },
});
const updateVelMesh = new THREE.Mesh(planeGeo, updateVelMat);
updateVelScene.add(updateVelMesh);

// Create offscreen scene for updating positions.
const updatePosScene = new THREE.Scene();

// Create material and mesh for updating positions.
import posVert from "./shaders/update.vert";
import posFrag from "./shaders/updatePos.frag";
const updatePosMat = new THREE.RawShaderMaterial({
  vertexShader: posVert,
  fragmentShader: posFrag,
  uniforms: {
    uTexPositions: { value: texPositions },
    uTexVelocities: { value: texVelocities },
    uTexForces: { value: texForces },
    uDeltaTime: { value: 1 / 60.0 },
  },
});
const updatePosMesh = new THREE.Mesh(planeGeo, updatePosMat);
updatePosScene.add(updatePosMesh);

// Create points geometry.
const uvs = [];
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    uvs.push(x / size, y / size);
  }
}

const pointsGeo = new THREE.SphereGeometry(0.05);
pointsGeo.setAttribute(
  "instanceUv",
  new THREE.InstancedBufferAttribute(new Float32Array(uvs), 2),
);

// Create points material.
import renderVert from "./shaders/render.vert";
import renderFrag from "./shaders/render.frag";

const pointsMat = new THREE.RawShaderMaterial({
  vertexShader: renderVert,
  fragmentShader: renderFrag,
  uniforms: {
    uTexPositions: { value: texPositions },
    uTexVelocities: { value: texVelocities },
    uColorBoost: { value: 1.0 },
  },
});

// Add gui params.
gui
  .add(pointsMat.uniforms.uColorBoost, "value")
  .min(0)
  .max(5)
  .step(0.1)
  .name("color boost");

// Create and add mesh to scene.
const points = new THREE.InstancedMesh(pointsGeo, pointsMat, size * size);
scene.add(points);

// Animation loop.
const clock = new THREE.Clock();
const tick = () => {
  const dt = clock.getDelta();

  updatePosMat.uniforms.uDeltaTime.value = dt;
  updateVelMat.uniforms.uDeltaTime.value = dt;
  updateForceMat.uniforms.uDeltaTime.value = dt;

  if (firstRun) {
    updateForces(texPositions, texForces, bufferForces[dstIdx]);
    updateVelocities(
      texPositions,
      texVelocities,
      bufferForces[dstIdx].texture,
      bufferVelocities[dstIdx],
    );
    updatePositions(
      texPositions,
      bufferVelocities[dstIdx].texture,
      bufferPositions[dstIdx],
    );
    firstRun = false;
  } else {
    updateForces(
      bufferPositions[srcIdx].texture,
      bufferForces[srcIdx].texture,
      bufferForces[dstIdx],
    );
    updateVelocities(
      bufferPositions[srcIdx].texture,
      bufferVelocities[srcIdx].texture,
      bufferForces[dstIdx].texture,
      bufferVelocities[dstIdx],
    );
    updatePositions(
      bufferPositions[srcIdx].texture,
      bufferVelocities[dstIdx].texture,
      bufferPositions[dstIdx],
    );
  }

  // Set target texture as input for points.
  renderer.setRenderTarget(null);
  pointsMat.uniforms.uTexPositions.value = bufferPositions[dstIdx].texture;
  pointsMat.uniforms.uTexVelocities.value = bufferVelocities[dstIdx].texture;
  updateScene();

  // Swap source and destination.
  srcIdx = 1 - srcIdx;
  dstIdx = 1 - dstIdx;

  requestAnimationFrame(tick);
};
tick();

// Window resize listener.
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  resizeScene(w, h);
});

// Mouse raycaster.
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (event.clientY / window.innerHeight) * 2 - 1;

  updateForceMat.uniforms.uMousePos.value = [mouse.x, mouse.y];

  raycaster.setFromCamera(mouse, camera);
  // const intersect = raycaster.intersectObject(paintMesh);
  // if (intersect != null && intersect.length > 0) {
  //   const nearestHit = intersect[0];

  //   if (nearestHit.face != null) {
  //     const center = nearestHit.point;

  //     // console.log(vertexIndicesInArea);
  //   }
  // }
});

function updateForces(srcPosTex, srcForceTex, dstForceBuffer) {
  renderer.setRenderTarget(dstForceBuffer);
  updateForceMat.uniforms.uTexPositions.value = srcPosTex;
  updateForceMat.uniforms.uTexForces.value = srcForceTex;
  renderer.render(updateForceScene, camera);
}

function updateVelocities(srcPosTex, srcVelTex, srcForceTex, dstVelBuffer) {
  renderer.setRenderTarget(dstVelBuffer);
  updateVelMat.uniforms.uTexPositions.value = srcPosTex;
  updateVelMat.uniforms.uTexVelocities.value = srcVelTex;
  updateVelMat.uniforms.uTexForces.value = srcForceTex;
  renderer.render(updateVelScene, camera);
}

function updatePositions(srcPosTex, srcVelTex, dstPosBuffer) {
  renderer.setRenderTarget(dstPosBuffer);
  updatePosMat.uniforms.uTexPositions.value = srcPosTex;
  updatePosMat.uniforms.uTexVelocities.value = srcVelTex;
  renderer.render(updatePosScene, camera);
}
