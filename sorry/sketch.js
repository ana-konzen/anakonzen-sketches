let img;

const draggedPixels = [];

function preload() {
  img = loadImage("pearl.png");
}

function setup() {
  img.resize(0, windowHeight);
  createCanvas(img.width, img.height);

  // pixelDensity(1);
}

function draw() {
  image(img, 0, 0, img.width, img.height);

  img.loadPixels();

  if (mouseIsPressed) {
    distortImage(img, mouseX, mouseY, 30, 2, 0);
  } else {
    distortImage(img, mouseX, mouseY, 60, 1, 1);
  }

  img.updatePixels();
}

function distortImage(img, x, y, radius, n1, n2) {
  for (let i = -radius; i < radius; i++) {
    for (let j = -radius; j < radius; j++) {
      if (dist(i, j, 0, 0) < radius) {
        let x1 = constrain(x + i, 0, img.width);
        let y1 = constrain(y + j, 0, img.height);
        let index1 = 4 * (y1 * width + x1);
        let x2 = constrain(x + i * n1 + n2, 0, img.width);
        let y2 = constrain(y + j * n1 + n2, 0, img.height);
        let index2 = 4 * (y2 * width + x2);

        img.pixels[index1] = img.pixels[index2];
        img.pixels[index1 + 1] = img.pixels[index2 + 1];
        img.pixels[index1 + 2] = img.pixels[index2 + 2];
        img.pixels[index1 + 3] = img.pixels[index2 + 3];
      }
    }
  }
}

function keyPressed() {
  if (key === "s") {
    save("sorry");
  }
}
