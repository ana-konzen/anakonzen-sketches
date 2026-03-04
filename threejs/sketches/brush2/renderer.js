import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Create renderer.
const canvas = document.querySelector("#canvas");
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create scene.
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x292f33);

// Create camera.
export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
);
camera.position.z = 2.0;
scene.add(camera);

//Add mouse controls for camera.
export const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

export function resizeScene(w, h) {
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

export function updateScene() {
  controls.update();
  renderer.render(scene, camera);
}
