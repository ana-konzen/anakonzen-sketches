const squares = [];
const newSquares = [];
const rows = 4;
const cols = 4;
const maxCounter = 40;
const sqSize = 100;

const palette = [
  "#F4F1DE",
  "#EAB69F",
  "#E5987F",
  "#E07A5F",
  "#8F5D5D",
  "#3D405B",
  "#5F797B",
  "#81B29A",
  "#BABF95",
  "#F2CC8F",
  "#B86C5E",
];

let counter = 0;

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);

  for (let y = 0; y < rows; y++) {
    createRow();
  }

  for (let x = 0; x < cols - 1; x++) {
    createCol();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  let numRow = squares.length;
  let numCol = squares[0].length;

  let rectWidth = numCol * sqSize;
  let rectHeight = numRow * sqSize;

  translate(width / 2 - rectWidth / 2, height / 2 - rectHeight / 2);

  for (let row of squares) {
    for (let sq of row) {
      sq.show();
    }
  }

  for (let sq of newSquares) {
    sq.show();
  }
}

function mouseMoved() {
  let numRow = squares.length;
  let numCol = squares[0].length;

  let rectWidth = numCol * sqSize;
  let rectHeight = numRow * sqSize;

  for (let row of squares) {
    for (let sq of row) {
      if (
        mouseX > sq.x + width / 2 - rectWidth / 2 &&
        mouseX < sq.x + sq.size + width / 2 - rectWidth / 2 &&
        mouseY > sq.y + height / 2 - rectHeight / 2 &&
        mouseY < sq.y + sq.size + height / 2 - rectHeight / 2
      ) {
        sq.counter++;

        fraction = pow(1 - min(sq.counter / maxCounter, 1), 0.8);
        let newS = new Square(
          sq.x + (sq.size - sq.size * fraction) / 2,
          sq.y + (sq.size - sq.size * fraction) / 2,
          sq.size * fraction,
        );
        if (sq.lastChild == -1) {
          while (newS.colr == sq.colr) {
            newS.colr = random(palette);
          }
        } else {
          while (newS.colr == newSquares[sq.lastChild].colr) {
            newS.colr = random(palette);
          }
        }
        newSquares.push(newS);
        sq.lastChild = newSquares.length - 1;
      }
    }
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    createCol();
  }
  if (keyCode === DOWN_ARROW) {
    createRow();
  }
  if (keyCode === 32) {
    createCol();
    createRow();
  }
  if (key === "s") {
    saveCanvas();
  }
}

class Square {
  constructor(x, y, size) {
    this.colr = random(palette);
    this.size = size;
    this.x = x;
    this.y = y;
    this.lastChild = -1;
    this.counter = 0;
  }
  show() {
    noStroke();
    fill(this.colr);
    square(this.x, this.y, this.size);
  }
}

function createRow() {
  let numRow = squares.length;
  if (numRow == 0) {
    squares.push([new Square(0, 0, sqSize)]);
  } else {
    let numCol = squares[0].length;
    let newRow = [];
    for (i = 0; i < numCol; i++) {
      let sq = new Square(i * sqSize, numRow * sqSize, sqSize);
      if (i == 0) {
        while (sq.colr == squares[numRow - 1][i].colr) {
          sq.colr = random(palette);
        }
      } else {
        while (
          sq.colr == squares[numRow - 1][i].colr ||
          sq.colr == newRow[i - 1].colr
        ) {
          sq.colr = random(palette);
        }
      }
      newRow.push(sq);
    }
    squares.push(newRow);
  }
}

function createCol() {
  let numRow = squares.length;
  let numCol = squares[0].length;

  for (i = 0; i < numRow; i++) {
    let sq = new Square(numCol * sqSize, i * sqSize, sqSize);

    if (i == 0) {
      while (sq.colr == squares[i][numCol - 1].colr) {
        sq.colr = random(palette);
      }
    } else {
      while (
        sq.colr == squares[i][numCol - 1].colr ||
        sq.colr == squares[i - 1][numCol].colr
      ) {
        sq.colr = random(palette);
      }
    }

    squares[i].push(sq);
  }
}
