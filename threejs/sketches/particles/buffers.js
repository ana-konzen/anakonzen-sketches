import { size } from "./main.js";
import { random } from "../shared/js/util.js";
import * as THREE from "three";

function getDataArray(min, max) {
  const arr = new Float32Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    arr[i * 4 + 0] = random(min, max);
    arr[i * 4 + 1] = random(min, max);
    arr[i * 4 + 2] = random(min, max);
  }
  return arr;
}

export function getDataTexture(min, max) {
  const data = getDataArray(min, max);
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
