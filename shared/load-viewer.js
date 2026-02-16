export function loadViewer(files) {
  // Derive basePath and prefix file paths from the current URL.
  // e.g. /threejs/ball/ → basePath "/threejs", sketch "ball"
  const parts = window.location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const sketch = parts.pop();
  const basePath = "/" + parts.join("/");
  const prefixed = files.map((f) => `sketches/${sketch}/${f}`);

  const cvScript = document.createElement("script");
  cvScript.src = "/shared/code-viewer.js";
  cvScript.onload = () => initCodeViewer(prefixed, basePath);
  document.body.appendChild(cvScript);
}
