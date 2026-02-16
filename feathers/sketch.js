let t;

const palette = [
  ["#bd0808", "#ffbc12"],
  ["#5586ab", "#a4e9f5"],
  ["#112685", "#c97118"],
];

const feathers = [];
function setup() {
  createCanvas(600, 600);
  angleMode(DEGREES);
  t = new Turtle();
  // t.show();
  noLoop();
}

function draw() {
  background("#ebe8df");

  noFill();
  stroke(0, 0, 0, 100);
  strokeWeight(2);

  for (let i = 0; i < 1; i++) {
    const featherColor = random(palette);
    feathers.push(
      new Feather(
        width / 2,
        height - random(100),
        i * 10,
        random(200, 400),
        random(100, 200),
        featherColor[0],
        featherColor[1],
      ),
    );
  }

  for (const feather of feathers) {
    feather.draw();
  }
}

class Feather {
  constructor(x, y, dimension, length, w, stemColor, plumeColor) {
    this.length = length / 2;
    this.x = x;
    this.y = y;
    this.plumeStart = 30;
    this.stemColor = color(stemColor);
    this.plumeColor = color(plumeColor);
    this.width = w;
    this.rangesLeft = [];
    this.rangesRight = [];
    this.dimension = dimension;
    this.numClusters = floor(random(4, 7));
    for (let i = 0; i < this.numClusters; i++) {
      const r = floor(random(3, 10));
      for (let j = 0; j < r; j++) {
        this.rangesLeft.push(r);
      }
    }
    for (let i = 0; i < this.numClusters; i++) {
      const r = floor(random(3, 10));
      for (let j = 0; j < r; j++) {
        this.rangesRight.push(r);
      }
    }
  }
  drawPlume(j, factor, dim, ranges) {
    push();

    t.turnLeft(-100 * factor);
    let d;
    if (j > this.length * 0.8) {
      d = map(j, this.length * 0.8, this.length, 0.1, 0.85);
      t.turnLeft(100 * factor * d);
    }
    this.ang =
      (noise(
        floor(j / ranges[j % this.numClusters]) * 0.5,
        dim,
        this.dimension,
      ) -
        0.5) *
      40;

    t.turnRight(this.ang);

    this.plumeW =
      sin(
        (((j - this.plumeStart) * 2) /
          (this.length * 2 - this.plumeStart * 2 + this.length)) *
          180,
      ) *
        this.width +
      noise(j * 0.05, dim * 2, this.dimension) * 20;
    if (j < this.plumeStart + this.length * 0.2) {
      this.plumeW += random(2, 5);
      t.turnRight(random(-2, 2));
    }
    for (let i = 0; i < this.plumeW; i++) {
      this.alpha = map(i, 0, this.plumeW, 200, 50);
      const colorStep = map(i, 0, this.plumeW, 0.1, 0.8);
      const plumeColor = lerpColor(this.stemColor, this.plumeColor, colorStep);
      plumeColor.setAlpha(this.alpha);
      stroke(plumeColor);

      let weight = map(i, 0, this.plumeW, 2, 0);
      strokeWeight(weight + noise(i * 0.1, this.dimension));

      t.turnLeft(random(0.1 * factor, 1 * factor));

      t.moveForward(1 + (noise(i, dim * 3, this.dimension) - 0.5) * 2);
    }

    pop();
  }
  draw() {
    t.penUp();
    t.turnTo(0);
    t.moveTo(this.x, this.y);
    t.penDown();
    push();
    // rotate(random(10, 30));

    t.turnLeft(90);
    this.stemColor.setAlpha(100);
    stroke(this.stemColor);

    for (let i = 0; i < this.length; i++) {
      strokeWeight(noise(i * 0.01, this.dimension) * 5 + 5);

      t.moveForward(2);

      t.turnLeft(noise(i * 0.001, this.dimension) - 0.5);
      if (i > this.plumeStart) {
        t.pushState();
        this.drawPlume(i, -1, 1, this.rangesRight);
        t.popState();
        t.pushState();
        this.drawPlume(i, 1, 1, this.rangesLeft);
        t.popState();
      }
    }
    pop();
  }
}

function mousePressed() {
  saveCanvas("feather");
}
