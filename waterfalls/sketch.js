let myStroke;
let bColor;
const splashes = [];
const textures = [];
let waterfall = [];
const palettePaint = [
  "#64B87A",
  "#E77A59",
  "#F12A2A",
  "#fff",
  "#17bfba",
  "#fadd23",
];
const paletteBackground = [
  "#197030",
  "#d14e26",
  "#bf1717",
  "#181818",
  "#17bfba",
  "#fadd23",
];

function setup() {
  createCanvas(400, 500);
  let wColor = random(palettePaint);
  bColor = random(paletteBackground);
  while (bColor === wColor) {
    bColor = random(paletteBackground);
  }

  for (let i = 0; i < 50; i++) {
    splashes.push(new Splash(wColor));
  }

  let tColor = color(wColor);
  tColor.setAlpha(1);
  for (let i = 0; i < 50; i++) {
    let s = new Stroke(
      random(width),
      random(height),
      random(50, 100),
      random(50, 100),
      tColor,
    );
    s.setStroke(200, "light", "watercolor");
    s.rotate(random(50));
    textures.push(s);
  }

  let numWaterfalls = int(random(1, 4));

  // let numWaterfalls = 1;

  for (let i = 0; i < numWaterfalls; i++) {
    if (numWaterfalls === 1) {
      createWaterfall(width / 2, 0, random(50, width - 100), wColor, waterfall);
    } else {
      let wWidth = random(50, 100);
      createWaterfall(
        100 / numWaterfalls + wWidth * (i * 2),
        0,
        wWidth,
        wColor,
        waterfall,
      );
    }
  }

  noLoop();
  angleMode(DEGREES);
}

function draw() {
  background(bColor);

  push();
  for (let t of textures) {
    t.drawStroke();
  }
  pop();

  push();
  angleMode(DEGREES);
  for (let w of waterfall) {
    w.drawStroke();
  }
  pop();

  // noStroke();
  // fill(0, 1);
  // stroke(255, 1);
  push();
  for (let s of splashes) {
    s.show();
  }
  pop();
}

function mousePressed() {
  save("waterfall.png");
}

function createWaterfall(posx, posy, size, color, arr) {
  let w1 = new Stroke(
    posx,
    210 + posy,
    size + random(-50, 50),
    height + 50,
    color,
  );
  w1.setStroke(100, "medium", "dry_brush", 10);
  let w2 = new Stroke(
    posx + random(-25, 25),
    150 + posy,
    size + random(-50, 50),
    height / 2 + random(100),
    color,
  );
  w2.setStroke(100, "medium", "dry_brush");
  let w3 = new Stroke(
    posx + random(-25, 25),
    100 + posy,
    size + random(-50, 50),
    height / 2 + random(-50, 0),
    color,
  );
  w3.setStroke(100, "medium", "dry_brush");
  let w4 = new Stroke(
    posx + random(-50, 50),
    200 + posy,
    size + random(-100, -50),
    height / 2 + random(-50, 0),
    color,
  );
  w4.setStroke(100, "medium", "dry_brush");
  arr.push(w1, w2, w3, w4);
}

class Splash {
  constructor(colorr) {
    this.x = random(width);
    this.y = max(
      random(height / 2 + random(0, 100), height + 50),
      random(height / 2 + random(0, 100), height + 50),
      random(height / 2 + random(0, 100), height + 50),
      random(height / 2 + random(0, 100), height + 50),
    );
    this.num = random(50, 200);
    this.factor = random(PI / 10, PI / 5);
    this.sigma = random(PI / 30, PI / 10);
    this.radius = random(50, 150);
    this.ang = random(10, 100);
    this.sColor = color(colorr);
    this.hue1 = randomGaussian(this.sColor.levels[0], 2);
    this.hue2 = randomGaussian(this.sColor.levels[1], 2);
    this.hue3 = randomGaussian(this.sColor.levels[2], 2);
    this.color = color(this.hue1, this.hue2, this.hue3, 50);
  }
  show() {
    noStroke();
    for (let i = 0; i < 15; i++) {
      push();
      angleMode(DEGREES);
      translate(this.x, this.y);
      rotate(this.ang);
      rotate(random(1, 5) * i);
      angleMode(RADIANS);
      for (let j = 0; j < this.num; j++) {
        fill(this.color);
        let r = randomGaussian(this.radius, 1 + i);
        let theta = randomGaussian(this.factor, this.sigma);
        let x = -cos(theta) * r;
        let y = -sin(theta) * r;
        circle(x, y, random(0.5, 2));
      }
      pop();
    }
  }
}
