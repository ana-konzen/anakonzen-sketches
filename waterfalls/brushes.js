class Line {
  constructor(yMean, x, nPoints, sHeight, style, colorr) {
    this.yMean = yMean;
    this.x = x;
    this.nPoints = nPoints;
    this.arr = [];
    this.y = 0;
    this.angle = random(-2, 2);
    this.style = style;
    this.sHeight = sHeight;
    this.sColor = color(colorr);
    this.hue1 = randomGaussian(this.sColor.levels[0], 5);
    this.hue2 = randomGaussian(this.sColor.levels[1], 5);
    this.hue3 = randomGaussian(this.sColor.levels[2], 5);
    this.color = color(this.hue1, this.hue2, this.hue3, 10);
  }
  setLine() {
    let multiplier;
    let sigma = this.sHeight / 4;
    if (this.style === "dry_brush") {
      multiplier = 1;
      this.nPoints = this.nPoints * 2;
    } else if (this.style === "pencil") {
      multiplier = 0;
    }
    for (let i = 0; i < this.nPoints; i++) {
      this.y = this.yMean - 10 * this.sHeight;
      while (abs(this.y - this.yMean - multiplier * sigma) > 2.5 * sigma) {
        if (this.style === "dry_brush") {
          this.y = randomGaussian(this.yMean, sigma);
        } else if (this.style === "pencil") {
          this.y = random(this.yMean - 2 * sigma, this.yMean + 2 * sigma);
        }
      }

      this.arr.push(this.y);
    }
  }
  drawLine(vertical = true) {
    stroke(this.color);
    // noStroke();
    // fill(this.color);
    rotate(this.angle);
    for (let y of this.arr) {
      if (vertical) {
        point(this.x, y);
      } else {
        point(y, this.x);
      }
    }
  }
}

class Stroke {
  constructor(x, y, sWidth, sHeight, colorr) {
    this.x = x;
    this.sWidth = sWidth;
    this.sHeight = sHeight;
    this.y = y;
    this.ang = 0;
    this.arr = [];
    this.densityDict = {
      light: 10,
      medium: 30,
      hard: 80,
    };
    this.color = colorr;
    this.style = "";
  }

  rotate(ang) {
    this.ang = ang;
  }

  fill(colorr) {
    this.color = colorr;
  }
  setStroke(nLines, pressure = "medium", style = "dry_brush", texture = 5) {
    this.style = style;
    this.arr = [];
    if (this.style === "dry_brush" || this.style === "pencil") {
      let nPoints = (this.densityDict[pressure] / 4) * this.sHeight;
      let factor = (texture * this.sWidth) / nLines;
      let randomFactor;
      if (this.style === "dry_brush") {
        randomFactor = 1;
      } else if (this.style === "pencil") {
        randomFactor = 5;
      }

      for (let i = 0; i < nLines; i++) {
        let margin = min(random(factor), random(factor), random(factor));
        let l = new Line(
          random(-randomFactor, +randomFactor),
          -this.sWidth / 2 + (this.sWidth / nLines) * i + margin,
          nPoints,
          this.sHeight,
          style,
          this.color,
        );
        l.setLine();
        this.arr.push(l);
      }
    } else if (this.style === "watercolor") {
      let nShapes = this.densityDict[pressure] * 2;

      let nCircles = (this.sHeight - this.sWidth) / 10;
      console.log(nCircles);
      for (let i = 0; i < max(1, nCircles); i++) {
        let w = new Watercolor(i * 10, this.sWidth, this.color, nShapes);
        this.arr.push(w);
      }
    }
  }

  drawStroke(vertical = true) {
    for (let stroke of this.arr) {
      push();
      translate(this.x, this.y);
      rotate(this.ang);
      if (this.style === "dry_brush" || this.style === "pencil") {
        stroke.drawLine(vertical);
      } else if (this.style === "watercolor") {
        stroke.drawWc();
      }
      pop();
    }
  }
}

class Watercolor {
  constructor(x, sWidth, colorr, nShapes) {
    this.sColor = color(colorr);
    this.hue1 = randomGaussian(this.sColor.levels[0], 10);
    this.hue2 = randomGaussian(this.sColor.levels[1], 10);
    this.hue3 = randomGaussian(this.sColor.levels[2], 10);
    this.color = color(this.hue1, this.hue2, this.hue3, random(1, 5));
    this.size = random(1, 1.5);
    this.sWidth = sWidth;
    this.x = x;
    this.ang = random(PI * 2);
    this.factor = random(2);
    this.radius = [];
    this.angles = [];
    this.nShapes = nShapes;
  }

  sampleRadius() {
    this.radius = [];
    this.angles = [];

    for (let i = 0; i < PI * 2; i += 0.5) {
      let r = randomGaussian(this.sWidth, this.sWidth / 10);
      let theta = random(2 * PI);
      this.angles.push(theta);
      this.radius.push(r);
    }
  }

  drawWc() {
    fill(this.color);

    push();
    angleMode(RADIANS);
    noStroke();
    translate(0, this.x);

    // translate(this.factor, this.factor);
    // rotate(this.ang);
    // scale(this.size);
    for (let i = 0; i < this.nShapes; i++) {
      this.sampleRadius();
      beginShape();
      for (let j = 0; j < PI * 2; j += 0.5) {
        let r = this.radius[j];
        let x = cos(j + this.angles[j]) * r;
        let y = sin(j + this.angles[j]) * r;
        vertex(x, y);
      }
      endShape();
    }

    pop();
  }
}
