import * as THREE from "three";
import GUI from "lil-gui";
import Stats from "stats.js";
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

import { lerp, map } from "../shared/js/util.js";
import { getDataTexture, getRenderBuffers } from "./buffers.js";
import {
  scene,
  camera,
  renderer,
  updateScene,
  resizeScene,
  controls,
} from "./renderer.js";

const gui = new GUI();

export const size = 256;

const redColor = new THREE.Color("#e88c7d");
const blueColor = new THREE.Color("#7dd1e8");
const canvasColor = new THREE.Color("#faf8f2");
let selectedColor = redColor;

const texExtents = getDataTexture();
const bufferExtents = getRenderBuffers();

const texExtentsY = getDataTexture();
const bufferExtentsY = getRenderBuffers();

const texColors = getDataTexture([
  ...canvasColor.clone().convertLinearToSRGB().toArray(),
  1.0,
]);
const bufferColors = getRenderBuffers();

let srcIdx = 0;
let dstIdx = 1;

let firstRun = true;
let mouseDown = false;
let lastMousePos = new THREE.Vector2(0, 0);

// Create offscreen draw rectangle.
const planeGeo = new THREE.PlaneGeometry(1, 1, 1, 1);

const updateColorScene = new THREE.Scene();
import colorVert from "./shaders/update.vert";
import colorFrag from "./shaders/updateColor.frag";
const updateColorMat = new THREE.RawShaderMaterial({
  vertexShader: colorVert,
  fragmentShader: colorFrag,
  uniforms: {
    uTexExtents: { value: texExtents },
    uTexColors: { value: texColors },
    uTargetColor: {
      value: selectedColor.clone().convertLinearToSRGB().toArray(),
    },
    uMousePos: { value: [0.0, 0.0] },
    uMouseDown: { value: false },
  },
});
const updateColorMesh = new THREE.Mesh(planeGeo, updateColorMat);
updateColorScene.add(updateColorMesh);

// Create offscreen scene for updating extents.
const updateExtentScene = new THREE.Scene();

// Create material and mesh for updating extents.
import extentVert from "./shaders/update.vert";
import extentFrag from "./shaders/updateBrush.frag";
const updateExtentMat = new THREE.RawShaderMaterial({
  vertexShader: extentVert,
  fragmentShader: extentFrag,
  uniforms: {
    uTexExtents: { value: texExtents },
    uDeltaTime: { value: 1 / 60.0 },
    uMousePos: { value: [0.0, 0.0] },
    uMouseVel: { value: [0.0, 0.0] },
    uMouseDown: { value: false },
    uResolution: { value: [size, size] },
    uAxis: { value: 0 },
  },
});
const updateExtentMesh = new THREE.Mesh(planeGeo, updateExtentMat);
updateExtentScene.add(updateExtentMesh);

// Create offscreen scene for updating extents.
const updateExtentSceneY = new THREE.Scene();

// Create material and mesh for updating extents.
import extentVertY from "./shaders/update.vert";
import extentFragY from "./shaders/updateBrush.frag";
const updateExtentMatY = new THREE.RawShaderMaterial({
  vertexShader: extentVertY,
  fragmentShader: extentFragY,
  uniforms: {
    uTexExtents: { value: texExtents },
    uDeltaTime: { value: 1 / 60.0 },
    uMousePos: { value: [0.0, 0.0] },
    uMouseVel: { value: [0.0, 0.0] },
    uMouseDown: { value: false },
    uResolution: { value: [size, size] },
    uAxis: { value: 1 },
  },
});
const updateExtentMeshY = new THREE.Mesh(planeGeo, updateExtentMatY);
updateExtentSceneY.add(updateExtentMeshY);

// Create points geometry.
const uvs = [];
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    uvs.push(x / size, y / size);
  }
}

const paintGeo = new THREE.PlaneGeometry(2, 2, size - 1, size - 1);
paintGeo.setAttribute(
  "uv",
  new THREE.BufferAttribute(new Float32Array(uvs), 2),
);

// Create points material.
import renderVert from "./shaders/render.vert";
import renderFrag from "./shaders/render.frag";

const paintMat = new THREE.ShaderMaterial({
  vertexShader: renderVert,
  fragmentShader: renderFrag,
  uniforms: {
    uTexExtents: { value: texExtents },
    uTexExtentsY: { value: texExtentsY },

    uTexColors: { value: texColors },
    uColorBoost: { value: 1.0 },
    uResolution: { value: [size, size] },
  },
  extensions: {
    derivatives: true,
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthTest: true,
  depthWrite: false,
});
const paintMesh = new THREE.Mesh(paintGeo, paintMat);
scene.add(paintMesh);

const canvasGeo = new THREE.PlaneGeometry(2, 2, 10, 10);
const canvasMat = new THREE.MeshBasicMaterial({
  color: canvasColor,
  //   wireframe: true,
});
const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
canvasMesh.position.z = -0.01;
// scene.add(canvasMesh);

// Debug offscreen texture.
const debugGeo = new THREE.PlaneGeometry(2, 2);
const debugMat = new THREE.MeshBasicMaterial({
  map: bufferExtents[dstIdx].texture,
});
const debugMesh = new THREE.Mesh(debugGeo, debugMat);
// scene.add(debugMesh);

// Animation loop.
const clock = new THREE.Clock();
const tick = () => {
  stats.begin();
  const dt = clock.getDelta();

  updateExtentMat.uniforms.uDeltaTime.value = dt;
  updateExtentMatY.uniforms.uDeltaTime.value = dt;

  if (firstRun) {
    updateExtents(texExtentsY, bufferExtents[dstIdx]);
    updateExtentsY(bufferExtents[dstIdx], bufferExtentsY[dstIdx]);

    updateColors(
      bufferExtents[dstIdx].texture,
      texColors,
      bufferColors[dstIdx],
    );
    firstRun = false;
  } else {
    updateExtents(bufferExtentsY[srcIdx].texture, bufferExtents[dstIdx]);
    updateExtentsY(bufferExtents[dstIdx].texture, bufferExtentsY[dstIdx]);

    updateColors(
      bufferExtents[dstIdx].texture,
      bufferColors[srcIdx].texture,
      bufferColors[dstIdx],
    );
  }

  // Set target texture as input for points.
  renderer.setRenderTarget(null);
  paintMat.uniforms.uTexExtents.value = bufferExtentsY[dstIdx].texture;

  paintMat.uniforms.uTexColors.value = bufferColors[dstIdx].texture;

  updateScene();

  // Swap source and destination.
  srcIdx = 1 - srcIdx;
  dstIdx = 1 - dstIdx;
  stats.end();

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
  // if (!mouseDown) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  // mouse.y = (event.clientY / window.innerHeight) * 2 - 1;

  raycaster.setFromCamera(mouse, camera);
  const intersect = raycaster.intersectObject(paintMesh);
  if (intersect != null && intersect.length > 0) {
    const nearestHit = intersect[0];

    if (nearestHit.face != null) {
      if (mouseDown) {
        updateExtentMat.uniforms.uMouseDown.value = true;
        updateExtentMatY.uniforms.uMouseDown.value = true;
        updateColorMat.uniforms.uMouseDown.value = true;
      }

      updateExtentMat.uniforms.uMousePos.value = nearestHit.uv;
      updateExtentMatY.uniforms.uMousePos.value = nearestHit.uv;

      updateColorMat.uniforms.uMousePos.value = nearestHit.uv;

      // Calculate mouse velocity.
      const mouseVel = new THREE.Vector2().subVectors(
        nearestHit.uv,
        lastMousePos,
      );
      updateExtentMat.uniforms.uMouseVel.value = mouseVel.toArray();
      updateExtentMatY.uniforms.uMouseVel.value = mouseVel.toArray();

      // updateColorMat.uniforms.uMouseVel.value = mouseVel.toArray();
      lastMousePos.copy(nearestHit.uv);
    }
  }
});

window.addEventListener("mousedown", () => {
  mouseDown = true;
  controls.enableRotate = false;
});

window.addEventListener("mouseup", () => {
  mouseDown = false;
  controls.enableRotate = true;
  updateExtentMat.uniforms.uMouseDown.value = false;
  updateExtentMatY.uniforms.uMouseDown.value = false;
  updateColorMat.uniforms.uMouseDown.value = false;
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "c") {
    selectedColor = selectedColor === redColor ? blueColor : redColor;
    updateColorMat.uniforms.uTargetColor.value = selectedColor
      .clone()
      .convertLinearToSRGB()
      .toArray();
  }
});

function updateExtents(srcExtentTex, dstExtentBuffer) {
  renderer.setRenderTarget(dstExtentBuffer);
  updateExtentMat.uniforms.uTexExtents.value = srcExtentTex;
  renderer.render(updateExtentScene, camera);
}

function updateExtentsY(srcExtentTex, dstExtentBuffer) {
  renderer.setRenderTarget(dstExtentBuffer);
  updateExtentMatY.uniforms.uTexExtents.value = srcExtentTex;
  renderer.render(updateExtentSceneY, camera);
}

function updateColors(srcExtentTex, srcColorTex, dstColorBuffer) {
  renderer.setRenderTarget(dstColorBuffer);
  updateColorMat.uniforms.uTexExtents.value = srcExtentTex;
  updateColorMat.uniforms.uTexColors.value = srcColorTex;
  renderer.render(updateColorScene, camera);
}
