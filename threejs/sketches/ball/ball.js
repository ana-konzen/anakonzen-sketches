import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { loadViewer } from "../../../shared/load-viewer.js";
import vertShader from "./shaders/ball.vert";
import fragShader from "./shaders/ball.frag";
import basketballTextureUrl from "url:./textures/basketball.jpg";

// Create debug GUI.
const gui = new GUI();

// Create renderer.
const canvas = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create scene.
const scene = new THREE.Scene();
scene.background = new THREE.Color("#ebe8df");

// Create camera.
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
);
camera.position.z = -5;
scene.add(camera);

// Add mouse controls for camera.
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Load textures.
const textureLoader = new THREE.TextureLoader();
const basketballTex = textureLoader.load(basketballTextureUrl);

// Create groups and objects.
const group = new THREE.Group();
scene.add(group);

const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMat = new THREE.RawShaderMaterial({
  vertexShader: vertShader,
  fragmentShader: fragShader,
  uniforms: {
    uTexMap: { value: basketballTex },
    uTime: { value: 0.0 },
    uBounceSpeed: { value: 3.0 },
    uBounceHeight: { value: 3.0 },
    uStretch: { value: 0.5 },
    uSquash: { value: 0.5 },
    uAir: { value: 100.0 },
  },
});
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);

const paddleGeo = new THREE.CircleGeometry(2, 32);
const paddleMat = new THREE.MeshBasicMaterial({
  color: "#add945",
  side: THREE.DoubleSide,
});
const paddleMesh = new THREE.Mesh(paddleGeo, paddleMat);
paddleMesh.rotation.x = -Math.PI / 2;

group.add(paddleMesh);
group.add(sphereMesh);

group.rotation.x = -Math.PI / 90;
group.rotation.y = Math.PI / 3;
group.position.y = -2.5;

gui
  .add(sphereMat.uniforms.uBounceSpeed, "value")
  .min(0)
  .max(10)
  .step(0.5)
  .name("bounce speed");
gui
  .add(sphereMat.uniforms.uBounceHeight, "value")
  .min(0)
  .max(10)
  .step(0.5)
  .name("bounce height");
gui
  .add(sphereMat.uniforms.uStretch, "value")
  .min(0)
  .max(2)
  .step(0.1)
  .name("stretch");
gui
  .add(sphereMat.uniforms.uSquash, "value")
  .min(0)
  .max(2)
  .step(0.1)
  .name("squash");
gui
  .add(sphereMat.uniforms.uAir, "value")
  .min(0)
  .max(100)
  .step(5)
  .name("air fill (%)");

// Animation loop.
const clock = new THREE.Clock();

const tick = () => {
  sphereMat.uniforms.uTime.value = clock.getElapsedTime();

  // group.rotation.x += 0.01;
  // group.rotation.y += 0.02;

  controls.update();

  renderer.render(scene, camera);

  requestAnimationFrame(tick);
};
tick();

// Window resize listener.
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

loadViewer(["ball.js", "shaders/ball.vert", "shaders/ball.frag"]);
