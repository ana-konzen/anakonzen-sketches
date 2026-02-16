const particles = [];
const num = 1000;
const noiseScale = 0.01;
const palette = ["#30aac2", "#0f6070", "#60a0a6", "#9fcfd4", "#609194"];

function setup() {
  createCanvas(800, 400);
  noLoop();
  for (let i = 0; i < num; i++) {
    particles.push(createVector(random(width), random(height)));
  }
  background("#faf8f5");
}

function draw() {
  for (let i = 0; i < 100; i++) {
    stroke(random(palette));
    for (let p of particles) {
      strokeWeight(random(0.1, 2));
      point(p.x, p.y);
      let n = noise(p.x * noiseScale, p.y * noiseScale);
      let a = 2 * PI * n;
      p.x += cos(a);
      p.y += sin(a);
      if (!onScreen(p)) {
        p.x = random(width);
        p.y = random(height);
      }
    }
  }
}

function onScreen(v) {
  return v.x >= 0 && v.x <= width && v.y >= 0 && v.y <= height;
}

function mousePressed() {
  save("sea");
}
