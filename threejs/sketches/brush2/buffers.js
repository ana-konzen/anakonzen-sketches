import { size } from "./main.js";
import { random } from "../shared/js/util.js";
import * as THREE from "three";

function getDataArray(defaultValuesArray = [0, 0, 0, 0]) {
  const arr = new Float32Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    for (let j = 0; j < 4; j++) {
      arr[i * 4 + j] = defaultValuesArray[j] ?? 0;
    }
  }
  return arr;
}

export function getDataTexture(defaultValuesArray = [0, 0, 0, 0]) {
  const data = getDataArray(defaultValuesArray);
  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  texture.needsUpdate = true;
  return texture;
}

export function getRenderBuffers() {
  const buffers = [];
  for (let i = 0; i < 2; i++) {
    buffers.push(
      new THREE.WebGLRenderTarget(size, size, {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
      }),
    );
  }
  return buffers;
}
