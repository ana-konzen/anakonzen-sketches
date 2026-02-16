export function loadViewer(files, basePath) {
  // Load code viewer (injected at runtime to avoid Parcel processing)
  const cvScript = document.createElement("script");
  cvScript.src = "/shared/code-viewer.js";
  cvScript.onload = () => initCodeViewer(files, basePath);
  document.body.appendChild(cvScript);
}
