/*

Mondrian generator

use your mouse to change the lighting direction, or click on "fixed light" to fix it to the top left


*/

let mapShader, rndSeed;

let offSlider, scaleSlider, lightSlider, heightSlider, widthSlider;

let fixedLight = true;

let paintingW = 300;
let paintingH = 300;

function preload() {
  mapShader = loadShader("map.vert", "map.frag");
}

function setup() {
  createCanvas(400, 400, WEBGL);
  //   pixelDensity(1);
  // randomSeed(30);
  rndSeed = random() * 100;

  // const heightCont = createDiv("height").parent("slider-cont");

  heightSlider = createSlider(40, 390, 300).parent(
    createDiv("height").parent("slider-cont"),
  );

  widthSlider = createSlider(40, 390, 300).parent(
    createDiv("width").parent("slider-cont"),
  );
  offSlider = createSlider(0, 100, 10).parent(
    createDiv("noise offset").parent("slider-cont"),
  );
  scaleSlider = createSlider(0, 100, 30).parent(
    createDiv("noise scale").parent("slider-cont"),
  );
  lightSlider = createSlider(0, 200, 100).parent(
    createDiv("light intensity").parent("slider-cont"),
  );

  select("#show-sliders").mouseClicked(() => {
    select("#slider-cont").toggleClass("show");
    select("#show-sliders").toggleClass("selected");
  });

  select("#fixed-light").mouseClicked(() => {
    fixedLight = !fixedLight;
    select("#fixed-light").toggleClass("selected");
  });

  select("#randomize").mouseClicked(() => {
    rndSeed = random() * 100;
  });

  select("#menu-cont").position(0, height);
}

function draw() {
  orbitControl();
  background("#ebe8df");

  noStroke();

  paintingH = heightSlider.value();
  paintingW = widthSlider.value();

  const mousePos = [
    map(mouseX, 0, paintingW, -0.5, 0.5),
    map(mouseY, 0, paintingH, -0.5, 0.5),
  ];

  mapShader.setUniform("uResolution", [width, height]);
  mapShader.setUniform("uSeed", rndSeed);

  mapShader.setUniform("uMousePos", fixedLight ? [0.01, 0.01] : mousePos);

  mapShader.setUniform("uNoiseScale", scaleSlider.value());
  mapShader.setUniform("uOffsetScale", offSlider.value());
  mapShader.setUniform("uLight", lightSlider.value());

  shader(mapShader);

  plane(paintingW, paintingH, 250, 250);
}
