import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { loadViewer } from "../../../shared/load-viewer.js";
import vertShader from "./shaders/ball.vert";
import fragShader from "./shaders/ball.frag";
import terrainUrl from "url:./textures/terrain.jpg";

// Create debug GUI.
const gui = new GUI();

// Create renderer.
const canvas = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create scene.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x292f33);

// Create camera.
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
);
camera.position.z = -2;
scene.add(camera);

// Add mouse controls for camera.
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Load textures.
const textureLoader = new THREE.TextureLoader();
const earthTex = textureLoader.load(terrainUrl);

// Create groups and objects.
const group = new THREE.Group();
scene.add(group);

const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMat = new THREE.RawShaderMaterial({
  vertexShader: vertShader,
  fragmentShader: fragShader,
  uniforms: {
    uTerrainMap: { value: earthTex },
    uTime: { value: 0.0 },
    uNoiseScale: { value: 2.0 },
    uOffsetScale: { value: 0.1 },
  },
});
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
group.add(sphereMesh);

gui
  .add(sphereMat.uniforms.uNoiseScale, "value")
  .min(0)
  .max(5)
  .step(0.01)
  .name("noise scale");
gui
  .add(sphereMat.uniforms.uOffsetScale, "value")
  .min(0)
  .max(1)
  .step(0.01)
  .name("offset scale");

// Animation loop.
const clock = new THREE.Clock();

const tick = () => {
  sphereMat.uniforms.uTime.value = clock.getElapsedTime();

  group.rotation.x += 0.01;
  group.rotation.y += 0.02;

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
