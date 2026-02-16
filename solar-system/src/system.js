import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const animateSystem = true;
const numSegments = 32;
const sunSize = 7;
const planets = [];
// Create renderer.
const canvas = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create scene.
const scene = new THREE.Scene();
scene.background = new THREE.Color("#cc5635");

// Create camera.
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
);
camera.position.z = -50;
camera.lookAt(0, 0, 0);
scene.add(camera);
scene.fog = new THREE.Fog("#f7da79", 0, 300);

const directionalLight = new THREE.DirectionalLight("#ffffff", 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const light = new THREE.PointLight(0xff0000, 10, 100);
light.position.set(50, 50, 50);
// scene.add(light);

const hemisphereLight = new THREE.HemisphereLight("#fcf3d4", "#b278bf", 1);
scene.add(hemisphereLight);

// Add mouse controls for camera.
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const sunGeo = new THREE.SphereGeometry(sunSize, numSegments, numSegments);
const sunMat = new THREE.MeshStandardMaterial({
  color: "#ffeeb8",
  roughness: 0,
  emissive: "#ffeeb8",
  emissiveIntensity: 0.5,
});
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);

for (let i = 0; i < 5; i++) {
  addPlanet(i);
}

const tick = () => {
  if (animateSystem) {
    sunMesh.rotation.x += 0.001;
    sunMesh.rotation.y += 0.002;
    sunMesh.rotation.z += 0.003;

    planets.forEach((planet) => {
      planet.userData.angle += planet.userData.speed;
      planet.position.x =
        Math.cos(planet.userData.angle) * planet.userData.radius;
      planet.position.z =
        Math.sin(planet.userData.angle) * planet.userData.radius;

      planet.rotation.x += planet.userData.rotationSpeed;

      planet.children.forEach((moon) => {
        moon.userData.angle += moon.userData.speed;
        moon.position.x = Math.cos(moon.userData.angle) * moon.userData.radius;
        moon.position.z = Math.sin(moon.userData.angle) * moon.userData.radius;
        moon.rotation.y += moon.userData.rotationSpeed;
      });
    });
  }

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

function addPlanet(i) {
  const numMoons = Math.floor(random(1, 7));
  const planetW = random(1.2, 3);

  const planetGeo = new THREE.SphereGeometry(planetW, numSegments, numSegments);
  const planetMat = new THREE.MeshStandardMaterial({
    color: "#d4affa",
    roughness: 0,
    emissive: "#d4affa",
    emissiveIntensity: 0.1,
  });
  const planetMesh = new THREE.Mesh(planetGeo, planetMat);

  const xOffset =
    i === 0
      ? 0
      : planets[i - 1].userData.radius +
        planets[i - 1].geometry.parameters.radius;

  const radius = sunSize * 2 + xOffset + random(0.5, 2) + i;
  const inclinationX = random(-0.4, 0.4);
  const inclinationZ = random(-0.4, 0.4);

  planetMesh.userData = {
    speed: random(0.001, 0.005),
    angle: random(0, Math.PI * 2),
    radius: radius,
    rotationSpeed: random(0.001, 0.01),
    inclinationX: inclinationX,
    inclinationZ: inclinationZ,
  };

  // Set initial position in the pivot's local XZ plane
  planetMesh.position.x = Math.cos(planetMesh.userData.angle) * radius;
  planetMesh.position.z = Math.sin(planetMesh.userData.angle) * radius;

  for (let j = 0; j < numMoons; j++) {
    addMoon(planetMesh, planetW, j);
  }

  const pivot = new THREE.Group();
  pivot.rotation.x = inclinationX;
  pivot.rotation.z = inclinationZ;
  pivot.add(planetMesh);
  sunMesh.add(pivot);

  addOrbitPath(pivot, radius, inclinationX, inclinationZ);

  planets.push(planetMesh);
  console.log(planetMesh);
}

function addMoon(planet, planetW, i) {
  const moonW = random(0.5, planetW * 0.33);
  const moonGeo = new THREE.SphereGeometry(moonW, numSegments, numSegments);
  const moonMat = new THREE.MeshStandardMaterial({
    color: "#d4faf4",
    roughness: 0,
    emissive: "#d4faf4",
    emissiveIntensity: 0.6,
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.name = "moon";
  moonMesh.position.x = planetW * 1.5 + i * random(0.25, 0.8);
  moonMesh.position.y = random(-0.5, 0.5);
  moonMesh.position.z = random(-0.5, 0.5);
  moonMesh.userData = {
    speed: random(0.001, 0.005),
    angle: random(0, Math.PI * 2),
    radius: moonMesh.position.length(),
    rotationSpeed: random(0.001, 0.01),
  };
  planet.add(moonMesh);
}

function addOrbitPath(pivot, radius) {
  const orbitGeo = new THREE.RingGeometry(radius - 0.15, radius + 0.15, 120);
  const orbitMat = new THREE.MeshBasicMaterial({
    color: "#f2eee1",
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });
  const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);

  orbitMesh.rotation.x = Math.PI / 2;

  pivot.add(orbitMesh);
}

function random(min = 0, max = 0) {
  return Math.random() * (max - min) + min;
}

// Load code viewer (injected at runtime to avoid Parcel processing)
const cvScript = document.createElement("script");
cvScript.src = "/shared/code-viewer.js";
cvScript.onload = () => initCodeViewer(["src/system.js"], "/solar-system");
document.body.appendChild(cvScript);
