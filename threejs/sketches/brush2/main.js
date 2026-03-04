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

const texBrushX = getDataTexture();
const bufferBrushX = getRenderBuffers();

const texBrushY = getDataTexture();
const bufferBrushY = getRenderBuffers();

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
let smoothedMouseVel = new THREE.Vector2(0, 0);

// Create offscreen draw rectangle.
const planeGeo = new THREE.PlaneGeometry(1, 1, 1, 1);

const updateColorScene = new THREE.Scene();
import colorVert from "./shaders/update.vert";
import colorFrag from "./shaders/updateColor.frag";
const updateColorMat = new THREE.RawShaderMaterial({
  vertexShader: colorVert,
  fragmentShader: colorFrag,
  uniforms: {
    uTexBrushData: { value: texBrushX },
    uTexColors: { value: texColors },
    uTargetColor: {
      value: selectedColor.clone().convertLinearToSRGB().toArray(),
    },
    uMousePos: { value: [0.0, 0.0] },
    uMouseDown: { value: false },
    uBrushRadius: { value: 0.1 },
    uDeltaTime: { value: 1 / 60.0 },
    uBlendStrength: { value: 0.05 },
    uResolution: { value: [size, size] },
    uMouseVel: { value: [0.0, 0.0] },
    uSmearStrength: { value: 1.0 },
  },
});
const updateColorMesh = new THREE.Mesh(planeGeo, updateColorMat);
updateColorScene.add(updateColorMesh);

import brushVertX from "./shaders/update.vert";
import brushFragX from "./shaders/updateBrush.frag";
const updateBrushMatX = getUpdateBrushMat(brushVertX, brushFragX, 0);

const updateBrushMeshX = new THREE.Mesh(planeGeo, updateBrushMatX);
const updateBrushSceneX = new THREE.Scene().add(updateBrushMeshX);

import brushVertY from "./shaders/update.vert";
import brushFragY from "./shaders/updateBrush.frag";
const updateBrushMatY = getUpdateBrushMat(brushVertY, brushFragY, 1);
const updateBrushMeshY = new THREE.Mesh(planeGeo, updateBrushMatY);
const updateBrushSceneY = new THREE.Scene().add(updateBrushMeshY);

const updateBufferAssets = [
  {
    scene: updateBrushSceneX,
    mat: updateBrushMatX,
  },
  {
    scene: updateBrushSceneY,
    mat: updateBrushMatY,
  },
];

// Create paint geometry.
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

// Create paint material.
import renderVert from "./shaders/render.vert";
import renderFrag from "./shaders/render.frag";

const paintMat = new THREE.ShaderMaterial({
  vertexShader: renderVert,
  fragmentShader: renderFrag,
  uniforms: {
    uTexBrushData: { value: texBrushX },
    uTexColors: { value: texColors },
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

console.log(selectedColor);

const colorOption = {
  value: selectedColor.getStyle(),
};

gui
  .addColor(colorOption, "value")
  .name("color")
  .onChange((value) => {
    updateColorMat.uniforms.uTargetColor.value = new THREE.Color(value)
      .clone()
      .convertLinearToSRGB()
      .toArray();
  });

const radiusController = gui
  .add(updateBrushMatX.uniforms.uBrushRadius, "value", 0.01, 0.3)
  .name("brush radius")
  .onChange((value) => {
    updateBrushMatY.uniforms.uBrushRadius.value = value;
    updateColorMat.uniforms.uBrushRadius.value = value;
  });

gui
  .add(updateBrushMatX.uniforms.uSmearStrength, "value", 0.0, 2.0)
  .name("smear strength")
  .onChange((value) => {
    updateBrushMatY.uniforms.uSmearStrength.value = value;
    updateColorMat.uniforms.uSmearStrength.value = value;
  });

gui
  .add(updateBrushMatX.uniforms.uDecaySpeed, "value", 0.0001, 0.2)
  .name("decay speed")
  .onChange((value) => {
    updateBrushMatY.uniforms.uDecaySpeed.value = value;
  });

gui
  .add(updateBrushMatX.uniforms.uLoadSpeed, "value", 0.0, 5.0)
  .name("load speed")
  .onChange((value) => {
    updateBrushMatY.uniforms.uLoadSpeed.value = value;
  });

gui
  .add(updateBrushMatX.uniforms.uDryingSpeed, "value", 0.0001, 0.1)
  .name("drying speed")
  .onChange((value) => {
    updateBrushMatY.uniforms.uDryingSpeed.value = value;
  });

gui
  .add(updateColorMat.uniforms.uBlendStrength, "value", 0.01, 0.2)
  .name("blend strength");

gui
  .add(updateBrushMatX.uniforms.uDilution, "value", 0.0, 1.0)
  .name("dilution")
  .onChange((value) => {
    updateBrushMatY.uniforms.uDilution.value = value;
  });

const canvasGeo = new THREE.PlaneGeometry(2, 2, 10, 10);
const canvasMat = new THREE.MeshBasicMaterial({
  color: canvasColor,
  //   wireframe: true,
});
const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
canvasMesh.position.z = -0.01;
scene.add(canvasMesh);

// Debug offscreen texture.
const debugGeo = new THREE.PlaneGeometry(2, 2);
const debugMat = new THREE.MeshBasicMaterial({
  map: bufferBrushX[dstIdx].texture,
});
const debugMesh = new THREE.Mesh(debugGeo, debugMat);
// scene.add(debugMesh);

// Animation loop.
const clock = new THREE.Clock();
const tick = () => {
  stats.begin();
  const dt = clock.getDelta();

  for (const asset of updateBufferAssets) {
    asset.mat.uniforms.uDeltaTime.value = dt;
  }
  updateColorMat.uniforms.uDeltaTime.value = dt;

  if (firstRun) {
    updateBrushData(0, texBrushY, bufferBrushX[dstIdx]);
    updateBrushData(1, bufferBrushX[dstIdx], bufferBrushY[dstIdx]);

    updateColors(bufferBrushY[dstIdx].texture, texColors, bufferColors[dstIdx]);
    firstRun = false;
  } else {
    updateBrushData(0, bufferBrushY[srcIdx].texture, bufferBrushX[dstIdx]);
    updateBrushData(1, bufferBrushX[dstIdx].texture, bufferBrushY[dstIdx]);

    updateColors(
      bufferBrushY[dstIdx].texture,
      bufferColors[srcIdx].texture,
      bufferColors[dstIdx],
    );
  }

  // Set target texture as input for paint mat.
  renderer.setRenderTarget(null);
  paintMat.uniforms.uTexBrushData.value = bufferBrushY[dstIdx].texture;
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

const brushStatus = document.getElementById("brushStatus");

let allowDrawing = true;

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
      Math.max(
        radiusController._min,
        updateBrushMatX.uniforms.uBrushRadius.value - 0.01,
      ),
    );
  }
  if (event.key === "]") {
    radiusController.setValue(
      Math.min(
        radiusController._max,
        updateBrushMatX.uniforms.uBrushRadius.value + 0.01,
      ),
    );
  }
});

// Mouse raycaster.
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  if (!allowDrawing) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  // mouse.y = (event.clientY / window.innerHeight) * 2 - 1;

  raycaster.setFromCamera(mouse, camera);
  const intersect = raycaster.intersectObject(paintMesh);
  if (intersect != null && intersect.length > 0) {
    const nearestHit = intersect[0];

    if (nearestHit.face != null) {
      if (mouseDown) {
        for (const asset of updateBufferAssets) {
          asset.mat.uniforms.uMouseDown.value = true;
        }
        updateColorMat.uniforms.uMouseDown.value = true;
      }

      for (const asset of updateBufferAssets) {
        asset.mat.uniforms.uMousePos.value = nearestHit.uv;
      }

      updateColorMat.uniforms.uMousePos.value = nearestHit.uv;

      // Calculate smoothed mouse velocity.
      const rawVel = new THREE.Vector2().subVectors(
        nearestHit.uv,
        lastMousePos,
      );
      smoothedMouseVel.lerp(rawVel, 0.3);

      for (const asset of updateBufferAssets) {
        asset.mat.uniforms.uMouseVel.value = smoothedMouseVel.toArray();
      }
      updateColorMat.uniforms.uMouseVel.value = smoothedMouseVel.toArray();

      lastMousePos.copy(nearestHit.uv);
    }
  }
});

window.addEventListener("mousedown", () => {
  mouseDown = true;
});

window.addEventListener("mouseup", () => {
  mouseDown = false;
  for (const asset of updateBufferAssets) {
    asset.mat.uniforms.uMouseDown.value = false;
  }
  updateColorMat.uniforms.uMouseDown.value = false;
});

function getUpdateBrushMat(vertexShader, fragmentShader, axis) {
  return new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTexBrushData: { value: texBrushX },
      uDeltaTime: { value: 1 / 60.0 },
      uMousePos: { value: [0.0, 0.0] },
      uMouseVel: { value: [0.0, 0.0] },
      uMouseDown: { value: false },
      uResolution: { value: [size, size] },
      uAxis: { value: axis },
      uBrushRadius: { value: 0.1 },
      uSmearStrength: { value: 1.0 },
      uDecaySpeed: { value: 0.01 },
      uLoadSpeed: { value: 2.0 },
      uDryingSpeed: { value: 0.01 },
      uDilution: { value: 0.2 },
    },
  });
}

function updateBrushData(axis, srcBrushTex, dstBrushBuffer) {
  const asset = updateBufferAssets[axis];
  renderer.setRenderTarget(dstBrushBuffer);
  asset.mat.uniforms.uTexBrushData.value = srcBrushTex;
  renderer.render(asset.scene, camera);
}

function updateColors(srcBrushTex, srcColorTex, dstColorBuffer) {
  renderer.setRenderTarget(dstColorBuffer);
  updateColorMat.uniforms.uTexBrushData.value = srcBrushTex;
  updateColorMat.uniforms.uTexColors.value = srcColorTex;
  renderer.render(updateColorScene, camera);
}
