import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import spectral from "spectral.js";
import GUI from "lil-gui";

import { lerp, map } from "../shared/js/util.js";

const gui = new GUI();

// Create renderer.
const canvas = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create scene.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x292f33);

const canvasColor = new THREE.Color("#f5f1e6");

const colorOption = {
  threejs: new THREE.Color("#e88c7d"),
  hex: "#e88c7d",
  spectral: new spectral.Color("#e88c7d"),
};

let selectedColor = { ...colorOption };

const brushSettings = {
  radius: 0.1,
  dryingSpeed: 0.1,
};

gui
  .addColor(colorOption, "hex")
  .name("Color Option")
  .onChange((value) => {
    colorOption.threejs.set(value);
    colorOption.spectral = new spectral.Color(value);
    selectedColor = { ...colorOption };
  });

const radiusController = gui
  .add(brushSettings, "radius", 0.01, 0.5)
  .name("Brush Size");
gui.add(brushSettings, "dryingSpeed", 0.001, 0.2).name("Drying Speed");

// Create camera.
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
);
camera.position.z = 2.0;
scene.add(camera);

//Add mouse controls for camera.
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const canvasGeo = new THREE.PlaneGeometry(2, 2, 10, 10);
const canvasMat = new THREE.MeshBasicMaterial({
  color: canvasColor,
  //   wireframe: true,
});
const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
canvasMesh.position.z = -0.01;
scene.add(canvasMesh);

const numVerts = 280;
// Create geometry.
const tempGeo = new THREE.PlaneGeometry(2.0, 2.0, numVerts, numVerts);
const paintGeo = tempGeo;

// Generate extra attributes.
const extents = [];
const dryness = [];
const brushColor = [];
const isPainted = [];
for (let i = 0; i < paintGeo.attributes.position.count; i++) {
  extents.push(0.0);
  dryness.push(1.0);
  brushColor.push(canvasColor.r, canvasColor.g, canvasColor.b);
  isPainted.push(0.0);
}
paintGeo.setAttribute("extent", new THREE.Float32BufferAttribute(extents, 1));
paintGeo.setAttribute("dryness", new THREE.Float32BufferAttribute(dryness, 1));
paintGeo.setAttribute(
  "brushColor",
  new THREE.Float32BufferAttribute(brushColor, 3),
);
paintGeo.setAttribute(
  "isPainted",
  new THREE.Float32BufferAttribute(isPainted, 1),
);

// Create material.
import vertShader from "./shaders/pull.vert";
import fragShader from "./shaders/pull.frag";
const paintMat = new THREE.ShaderMaterial({
  vertexShader: vertShader,
  fragmentShader: fragShader,
  uniforms: {
    normalScale: { value: 1.0 },
  },
  extensions: {
    derivatives: true,
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthTest: true,
  depthWrite: false,
  //   wireframe: true,
});

// Create and add mesh to scene.
const paintMesh = new THREE.Mesh(paintGeo, paintMat);
scene.add(paintMesh);

drawPatch(8, 8, 40, 80, selectedColor.threejs);

// Animation loop.
const clock = new THREE.Clock();
const tick = () => {
  const dt = clock.getDelta();
  for (let i = 0; i < paintGeo.attributes.dryness.array.length; i++) {
    paintGeo.attributes.dryness.array[i] = Math.min(
      1.0,
      1 -
        Math.exp(-brushSettings.dryingSpeed * dt) *
          paintGeo.attributes.dryness.array[i],
    );
  }
  paintGeo.attributes.extent.needsUpdate = true;
  paintGeo.attributes.dryness.needsUpdate = true;
  paintGeo.attributes.brushColor.needsUpdate = true;
  paintGeo.attributes.isPainted.needsUpdate = true;
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

const brushStatus = document.getElementById("brushStatus");

let allowDrawing = true;
let isDrawing = false;

updateBrushStatus();

function updateBrushStatus() {
  controls.enableRotate = !allowDrawing;
  brushStatus.textContent = allowDrawing ? "on" : "off";
}

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "w") {
    allowDrawing = !allowDrawing;
    updateBrushStatus();
  }
  if (event.key === "[") {
    radiusController.setValue(
      Math.max(radiusController._min, brushSettings.radius - 0.01),
    );
  }
  if (event.key === "]") {
    radiusController.setValue(
      Math.min(radiusController._max, brushSettings.radius + 0.01),
    );
  }
});

canvas.addEventListener("mousedown", () => {
  isDrawing = true;
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});
// Mouse raycaster.
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  if (!isDrawing || !allowDrawing) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersect = raycaster.intersectObject(paintMesh);
  if (intersect != null && intersect.length > 0) {
    const nearestHit = intersect[0];

    if (nearestHit.face != null) {
      const center = nearestHit.point;
      const vertexIndicesInArea = [];

      for (let i = 0; i < paintGeo.attributes.position.count; i++) {
        const vertPos = getVertexPosition(i);
        const dist = vertPos.distanceTo(center);
        if (dist < brushSettings.radius) {
          const rawDist = map(dist, 0.0, brushSettings.radius, 1.0, 0.0);
          const distAmt = rawDist * rawDist * (3 - 2 * rawDist); // smoothstep
          vertexIndicesInArea.push({
            index: i,
            rawDist,
            distAmt,
            extent: paintGeo.attributes.extent.array[i],
            isPainted: paintGeo.attributes.isPainted.array[i] > 0.0,
            dryness: paintGeo.attributes.dryness.array[i],
            baseColor: new THREE.Color().fromArray(
              paintGeo.attributes.brushColor.array,
              i * 3,
            ),
            targetColor: selectedColor.threejs,
          });
        }
      }

      // console.log(vertexIndicesInArea);

      drawBrushArea(vertexIndicesInArea);
    }
  }
});

function drawBrushArea(vertexIndicesInArea) {
  for (let i = 0; i < vertexIndicesInArea.length; i++) {
    const { index, distAmt, extent } = vertexIndicesInArea[i];
    raiseVertices(index, distAmt);
    updateDryness(index, distAmt);
    blendColors(index, distAmt, extent);
    paintGeo.attributes.isPainted.array[index] = 1.0;
  }
}

function getVertexPosition(i) {
  const vertPos = new THREE.Vector3().fromBufferAttribute(
    paintGeo.attributes.position,
    i,
  );
  vertPos.applyMatrix4(paintMesh.matrixWorld);
  return vertPos;
}

function updateDryness(i, distAmt) {
  const initialDryness = paintGeo.attributes.dryness.array[i];
  let dryness = initialDryness;
  dryness = lerp(dryness, 0.0, 0.1);
  paintGeo.attributes.dryness.array[i] = lerp(initialDryness, dryness, distAmt);
}

function blendColors(i, distAmt, baseExtent) {
  const painted = paintGeo.attributes.isPainted.array[i] > 0.0;
  const dryness = paintGeo.attributes.dryness.array[i];

  if (!painted) {
    selectedColor = { ...colorOption }; // reset to default color for unpainted areas
    updateVertexColor(i, selectedColor.threejs);
    return;
  } else {
    selectedColor = { ...colorOption };
  }

  const baseColor = new THREE.Color().fromArray(
    paintGeo.attributes.brushColor.array,
    i * 3,
  );

  const wetness = 1 - THREE.MathUtils.clamp(dryness, 0, 1);
  const selectedExtent = paintGeo.attributes.extent.array[i];
  const extentRatio = baseExtent > 0 ? selectedExtent / baseExtent : 10;
  const extentMultiplier = Math.atan(Math.tan(0.5) * extentRatio);

  const blendAmt = wetness * 0.7 * distAmt;
  // const effectiveBlend = 0.1 * lerp(blendAmt, 1.0, extent);

  const spectralBase = new spectral.Color(baseColor.getStyle());
  const mix_max = 0.9;
  const spectralMix = spectral
    .mix(
      [spectralBase, mix_max * (1 - dryness ** 3) * (1 - extentMultiplier)],
      [
        selectedColor.spectral,
        (1 - mix_max * (1 - dryness ** 3)) * extentMultiplier,
      ],
    )
    .toString();

  document.querySelector("#base-color").textContent = spectralBase.toString();
  document.querySelector("#selected-color").textContent =
    selectedColor.spectral.toString();

  document.querySelector("#mix-color").textContent = spectralMix;

  const newColor = new THREE.Color(spectralMix);
  selectedColor = {
    threejs: newColor,
    hex: newColor.getStyle(),
    spectral: new spectral.Color(newColor.getStyle()),
  };
  updateVertexColor(i, newColor);
}

function updateVertexColor(i, color) {
  paintGeo.attributes.brushColor.array[i * 3] = color.r;
  paintGeo.attributes.brushColor.array[i * 3 + 1] = color.g;
  paintGeo.attributes.brushColor.array[i * 3 + 2] = color.b;
}

function raiseVertices(i, distAmt) {
  const initialExtent = paintGeo.attributes.extent.array[i];
  let extentAmt = initialExtent;
  extentAmt = lerp(extentAmt, 1.0, 0.1);
  // if extentAmt is already high, we want to raise it less, so we multiply by distAmt again
  paintGeo.attributes.extent.array[i] = lerp(
    initialExtent + 0.1 * distAmt,
    extentAmt,
    distAmt,
  );
}

function drawPatch(x, y, w, h, color) {
  for (let i = x; i < x + w; i++) {
    for (let j = y; j < y + h; j++) {
      const index = i + j * (numVerts + 1);
      updateVertexColor(index, color);
      paintGeo.attributes.extent.array[index] = 1.0;
      paintGeo.attributes.dryness.array[index] = 0.0;
      paintGeo.attributes.isPainted.array[index] = 1.0;
    }
  }
}
