let message = document.getElementById("message");
let instructions = document.getElementById("instructions");
let started = false;

let bgColour = "#E6EBE0";
let selectedColour = "#C84C09";

let canvas = {
  width: 600,
  height: 400,
};

let capture;

let globalBorderWidth = 10;

let brushSize = canvas.height / 20;
let drawTile;
let drawTileHeight;
let drawTileWidth;
let drawTileCentreY;

let beatCount = 16;
let instrumentCount = 4;
let instruments = [];
let barConstraints;
let instrumentTiles = [];
let counter;
let loopBeat;
let bpm = 140;

let instrumentPattern = [];
let instrumentFrequency = [];
let instrumentDuration = [];
let playInstrument = [];

let saveButton;
let clearButton;

let icon;
let bassIcon;
let cymbalIcon;
let synthIcon;
let cameraIcon;
let playIcon;
let stopIcon;
let minusIcon;
let plusIcon;

let cScale = [
  "C1",
  "D1",
  "E1",
  "F1",
  "G1",
  "A1",
  "B1",
  "C2",
  "D2",
  "E2",
  "F2",
  "G2",
  "A2",
  "B2",
  "C3",
  "D3",
  "E3",
  "F3",
  "G3",
  "A3",
  "B3",
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  "E5",
  "F5",
  "G5",
  "A5",
  "B5",
  "C6",
  "D6",
  "E6",
  "F6",
  "G6",
  "A6",
  "B6",
];

let durationArray = ["32n", "16n", "8n", "4n", "2n", "1n"];

function preload() {
  classifier = ml5.imageClassifier(imageModelURL + "model.json");
  bassIcon = loadImage("assets/bassDrum2.png");
  cymbalIcon = loadImage("assets/cymbal.png");
  synthIcon = loadImage("assets/synth2.png");
  cameraIcon = loadImage("assets/camera.png");
  playIcon = loadImage("assets/play.png");
  stopIcon = loadImage("assets/stop.png");
  plusIcon = loadImage("assets/plus.png");
  minusIcon = loadImage("assets/minus.png");
}

function resizeSequencer() {
  canvas.height = windowHeight / 1.5;
  canvas.width = (600 / 400) * canvas.height;

  barConstraints = {
    width: canvas.width,
    height: canvas.width / beatCount,
    centreX: canvas.width / 2,
  };

  icon = {
    width: barConstraints.height / 2,
    height: barConstraints.height / 2,
  };

  drawTileHeight = canvas.height / 2 - globalBorderWidth * 2;
  drawTileWidth = drawTileHeight;
  drawTileCentreY = canvas.height - drawTileHeight / 2 - globalBorderWidth;

  cameraIconConstraints = {
    x: canvas.width * 0.5,
    y: canvas.height * 0.43,
    width: drawTileWidth / 5,
    height: drawTileHeight / 5,
  };

  stopIconConstraints = {
    x: canvas.width * 0.59,
    y: canvas.height * 0.44,
    width: drawTileWidth / 5,
    height: drawTileHeight / 5,
  };

  playIconConstraints = {
    x: canvas.width * 0.41,
    y: canvas.height * 0.44,
    width: drawTileWidth / 4.9,
    height: drawTileHeight / 4.9,
  };

  minusIconConstraints = {
    x: canvas.width * 0.12,
    y: canvas.height * 0.44,
    width: drawTileWidth / 10,
    height: drawTileHeight / 10,
  };

  plusIconConstraints = {
    x: canvas.width * 0.25,
    y: canvas.height * 0.44,
    width: drawTileWidth / 11,
    height: drawTileHeight / 11,
  };
}

function setup() {
  capture = createCapture(VIDEO);
  capture.hide();

  counter = 0;
  for (let i = 0; i < instrumentCount; i++) {
    if (i == 0) {
      instruments[i] = new Tone.MembraneSynth().toMaster();
    } else if (i == 1) {
      instruments[i] = new Tone.MetalSynth({
        frequency: 250,
        envelope: {
          attack: 0.001,
          decay: 0.1,
          release: 0.01,
        },
        harmonicity: 3.1,
        modulationIndex: 16,
        resonance: 8000,
        octaves: 0.5,
      }).toMaster();
    } else if (i == 2) {
      instruments[i] = new Tone.AMSynth().toMaster();
      instruments[i].oscillator.type = "sine";
      instruments[i].modulation.type = "sawtooth";
      instruments[i].harmonicity.value = 1.05;
      instruments[i].envelope.attack = 0.001;
      instruments[i].modulationEnvelope.attack = 0.01;
    } else if (i == 3) {
      instruments[i] = new Tone.FMSynth({
        harmonicity: 1 / 2,
        modulationIndex: 20,
        detune: 0,
        oscillator: {
          type: "square",
        },
        envelope: {
          attack: 0.01,
          decay: 0.01,
          sustain: 1,
          release: 0.5,
        },
        modulation: {
          type: "sawtooth",
        },
        modulationEnvelope: {
          attack: 0.3,
          decay: 0,
          sustain: 1,
          release: 0.5,
        },
      }).toMaster();
    }

    playInstrument[i] = 0;
    instrumentPattern[i] = [];
    instrumentFrequency[i] = [];
    instrumentDuration[i] = [];
  }
  loopBeat = new Tone.Loop(song, "4n").start(0);

  resizeSequencer();
  createCanvas(canvas.width, canvas.height);

  for (let i = 0; i < instrumentCount; i++) {
    let barCentreY = barConstraints.height / 2 + barConstraints.height * i;
    instrumentTiles[i] = createBar(
      barConstraints.centreX,
      barCentreY,
      barConstraints.width,
      barConstraints.height,
      beatCount
    );
  }

  let drawTilePosition = createVector(canvas.width / 2, drawTileCentreY);
  drawTile = new Tile(
    drawTilePosition.x,
    drawTilePosition.y,
    drawTileWidth,
    drawTileHeight,
    true
  );
  drawTile.setup();

  saveButton = createButton("save doodle");
  clearDrawingButton = createButton("clear doodle");
  clearButton = createButton("clear tile");
  saveButton.mousePressed(saveDoodle);
  clearButton.mousePressed(clearSelectedTile);
  clearDrawingButton.mousePressed(clearDrawing);
}

function draw() {
  if (started) {
    instructions.innerHTML = "";
    message.innerHTML = "";
    background(bgColour);

    image(
      cameraIcon,
      cameraIconConstraints.x,
      cameraIconConstraints.y,
      cameraIconConstraints.width,
      cameraIconConstraints.height
    );
    image(
      playIcon,
      playIconConstraints.x,
      playIconConstraints.y,
      playIconConstraints.width,
      playIconConstraints.height
    );
    image(
      stopIcon,
      stopIconConstraints.x,
      stopIconConstraints.y,
      stopIconConstraints.width,
      stopIconConstraints.height
    );
    image(
      plusIcon,
      plusIconConstraints.x,
      plusIconConstraints.y,
      plusIconConstraints.width,
      plusIconConstraints.height
    );
    image(
      minusIcon,
      minusIconConstraints.x,
      minusIconConstraints.y,
      minusIconConstraints.width,
      minusIconConstraints.height
    );

    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(brushSize / 1.3);
    text(
      `BPM: ${bpm}`,
      minusIconConstraints.x * 1.55,
      minusIconConstraints.y,
      minusIconConstraints.width * 2,
      minusIconConstraints.height * 2
    );
    text(
      "take photo",
      canvas.width * 0.5,
      canvas.height * 0.48,
      drawTileWidth / 2,
      drawTileHeight / 4
    );
    drawTile.display();
    updateDrawing(drawTile);

    for (let i = 0; i < instrumentTiles.length; i++) {
      let iconPos = createVector(icon.width, instrumentTiles[i][0].position.y);
      if (i == 0) {
        image(bassIcon, iconPos.x, iconPos.y, icon.width, icon.height);
      } else if (i == 1) {
        image(cymbalIcon, iconPos.x, iconPos.y, icon.width, icon.height);
      } else if (i == 2) {
        image(synthIcon, iconPos.x, iconPos.y, icon.width, icon.height);
      } else if (i == 3) {
        image(synthIcon, iconPos.x, iconPos.y, icon.width, icon.height);
      }

      for (let j = 0; j < instrumentTiles[i].length; j++) {
        instrumentTiles[i][j].display();

        if (instrumentTiles[i][j].savedDoodle == undefined) {
          instrumentPattern[i][j] = 0;
        } else {
          instrumentPattern[i][j] = 1;
          instrumentFrequency[i][j] = instrumentTiles[i][j].frequency;
          instrumentDuration[i][j] = instrumentTiles[i][j].duration;
        }

        if (counter == j && Tone.Transport.state == "started") {
          instrumentTiles[i][j].selected = true;
        } else if (counter !== j && Tone.Transport.state == "started") {
          instrumentTiles[i][j].selected = false;
        }
      }
    }
  }
}

function playThrough() {
  Tone.Transport.start().bpm.value = bpm * (beatCount / 4);
}

function stopPlaying() {
  Tone.Transport.stop();
  for (let i = 0; i < instrumentTiles.length; i++) {
    for (let j = 0; j < instrumentTiles[i].length; j++) {
      instrumentTiles[i][j].selected = false;
    }
  }
}

function clearDrawing() {
  drawTile.mousePositions = [];
  drawTile.savedDoodle = undefined;
  drawTile.pGraphics.background(255);
}

function clearSelectedTile() {
  let tileSelected = false;
  for (let i = 0; i < instrumentTiles.length; i++) {
    for (let j = 0; j < instrumentTiles[i].length; j++) {
      if (instrumentTiles[i][j].selected) {
        tileSelected = true;
        instrumentTiles[i][j].mousePositions = [];
        instrumentTiles[i][j].savedDoodle = undefined;
        instrumentTiles[i][j].selected = false;
      }
    }
    if (i == instrumentTiles.length - 1 && tileSelected == false) {
      return alert("No tiles selected to clear!");
    }
  }
}

function updateDrawing(tile) {
  if (mouseIsPressed) {
    tile.checkBounds();
    if (tile.mouseOver) {
      let ratio = width / height;
      let x = mouseX - (width - tile.pGraphics.width) / 2;

      let y = map(
        mouseY,
        tile.position.y - tile.pGraphics.height / 2,
        tile.position.y,
        0,
        tile.pGraphics.height / 2
      );
      let mousePosition = createVector(x, y);
      tile.mousePositions.push(mousePosition);
    }
  }
}

function saveDoodle() {
  let save = false;
  if (drawTile.mousePositions.length > 0 || drawTile.savedDoodle != undefined) {
    for (let i = 0; i < instrumentTiles.length; i++) {
      for (let j = 0; j < instrumentTiles[i].length; j++) {
        if (instrumentTiles[i][j].selected) {
          save = true;
        }
      }
    }

    if (save == true && Tone.Transport.state !== "started") {
      let doodle = drawTile.pGraphics.get();

      for (let i = 0; i < instrumentTiles.length; i++) {
        for (let j = 0; j < instrumentTiles[i].length; j++) {
          if (instrumentTiles[i][j].selected) {
            instrumentTiles[i][j].mousePositions = drawTile.mousePositions;
            instrumentTiles[i][j].savedDoodle = doodle;
            // classifyImage(doodle);
            // instrumentTiles[i][j].wave = label;
            // console.log(    instrumentTiles[i][j].wave);
            let tileBlob = readBlob(instrumentTiles[i][j]);
            // console.log(tileBlob);
            let freq = getBlobFreqNote(
              cScale,
              tileBlob.centroid.y,
              0,
              instrumentTiles[i][j].savedDoodle.canvas.height
            );
            instrumentTiles[i][j].frequency = freq;

            let duration = getBlobDuration(
              tileBlob.bbox.w,
              instrumentTiles[i][j].savedDoodle.canvas.width
            );

            instrumentTiles[i][j].duration = duration;
            instrumentTiles[i][j].selected = false;
          }
        }
      }
    } else {
      return alert("Please select at least one tile to save your doodle.");
    }
  } else {
    return alert("Please take a photo or draw something first!");
  }
}

function createBar(
  galleryCentreX,
  galleryCentreY,
  galleryWidth,
  galleryHeight,
  beatCount = 16
) {
  let tiles = [];
  let tileHeight = galleryHeight - globalBorderWidth * 2;
  let tileWidth = tileHeight;

  for (let i = 0; i < beatCount; i++) {
    let leftWidth;
    if (beatCount % 2 == 0) {
      leftWidth =
        tileWidth * (beatCount / 2) + (globalBorderWidth * (beatCount + 1)) / 2;
    } else {
      leftWidth =
        tileWidth * (beatCount / 2) + globalBorderWidth * ceil(beatCount / 2);
    }

    let tileCentreX =
      galleryCentreX -
      leftWidth +
      globalBorderWidth +
      globalBorderWidth * i +
      tileWidth * i +
      tileWidth / 2;

    let tilePos = createVector(tileCentreX, galleryCentreY);
    let tile = new Tile(tilePos.x, tilePos.y, tileWidth, tileHeight);
    tiles.push(tile);
  }

  for (let i = 0; i < tiles.length; i++) {
    tiles[i].setup();
  }
  return tiles;
}

function takePhoto() {
  if (started) {
    // classifyImage(drawTile.pGraphics.get());
    drawTile.pGraphics.imageMode(CENTER);
    let capImg = capture.get();
    capImg.resize(
      drawTile.pGraphics.canvas.width,
      drawTile.pGraphics.canvas.height
    );
    capImg.filter(THRESHOLD, 0.4);
    capImg.filter(DILATE);

    drawTile.savedDoodle = capImg;
  }
}

function mouseClicked() {
  started = true;
  if (started) {
    if (
      mouseX > plusIconConstraints.x - cameraIconConstraints.width / 2 &&
      mouseX < plusIconConstraints.x + plusIconConstraints.width / 2 &&
      mouseY < plusIconConstraints.y + plusIconConstraints.height / 2 &&
      mouseY > plusIconConstraints.y - plusIconConstraints.height / 2
    ) {
      if (Tone.Transport.state != "started") {
        bpm++;
      }
    }

    if (
      mouseX > minusIconConstraints.x - minusIconConstraints.width / 2 &&
      mouseX < minusIconConstraints.x + minusIconConstraints.width / 2 &&
      mouseY < minusIconConstraints.y + minusIconConstraints.height / 2 &&
      mouseY > minusIconConstraints.y - minusIconConstraints.height / 2
    ) {
      if (Tone.Transport.state != "started") {
        bpm--;
      }
    }

    if (
      mouseX > cameraIconConstraints.x - cameraIconConstraints.width / 2 &&
      mouseX < cameraIconConstraints.x + cameraIconConstraints.width / 2 &&
      mouseY < cameraIconConstraints.y + cameraIconConstraints.height / 2 &&
      mouseY > cameraIconConstraints.y - cameraIconConstraints.height / 2
    ) {
      takePhoto();
    }

    if (
      mouseX > playIconConstraints.x - playIconConstraints.width / 2 &&
      mouseX < playIconConstraints.x + playIconConstraints.width / 2 &&
      mouseY < playIconConstraints.y + playIconConstraints.height / 2 &&
      mouseY > playIconConstraints.y - playIconConstraints.height / 2
    ) {
      playThrough();
    }

    if (
      mouseX > stopIconConstraints.x - stopIconConstraints.width / 2 &&
      mouseX < stopIconConstraints.x + stopIconConstraints.width / 2 &&
      mouseY < stopIconConstraints.y + stopIconConstraints.height / 2 &&
      mouseY > stopIconConstraints.y - stopIconConstraints.height / 2
    ) {
      stopPlaying();
    }
    for (let i = 0; i < instrumentTiles.length; i++) {
      for (let j = 0; j < instrumentTiles[i].length; j++) {
        instrumentTiles[i][j].checkBounds();
        if (instrumentTiles[i][j].mouseOver) {
          instrumentTiles[i][j].selected = !instrumentTiles[i][j].selected;
        }
      }
    }
  }
}

function getBlobDuration(width, maxWidth) {
  let duration =
    durationArray[
      floor(map(width, 0, maxWidth, 0, durationArray.length, true))
    ];

  return duration;
}

function getBlobFreqNote(scaleArray, yPos, minY, maxY) {
  let note =
    scaleArray[floor(map(yPos, maxY, minY, 0, scaleArray.length, true))];

  return note;
}

function readBlob(pG) {
  let img = createImage(
    pG.savedDoodle.canvas.width,
    pG.savedDoodle.canvas.height
  );
  img.copy(
    pG.savedDoodle,
    0,
    0,
    pG.savedDoodle.canvas.width,
    pG.savedDoodle.canvas.height,
    0,
    0,
    pG.savedDoodle.canvas.width,
    pG.savedDoodle.canvas.height
  );
  img.filter(DILATE);

  let blob = new Blob(img, 20, 4);
  return blob;
}

class Tile {
  constructor(centreX, centreY, w, h, enableDraw = false) {
    this.position = createVector(centreX, centreY);
    this.pGraphics = createGraphics(w, h);
    this.savedDoodle = undefined;
    this.selected = false;
    this.mouseOver = false;
    this.selectedBorderWidth = 10;
    this.enableDraw = enableDraw;
    this.mousePositions = [];
    this.frequency = undefined;
    this.duration = undefined;
    this.wave = undefined;
  }

  setup() {
    this.pGraphics.background(255);
  }

  display() {
    rectMode(CENTER);

    push();
    noFill(255);
    stroke(255);
    strokeWeight(1);
    rect(
      this.position.x,
      this.position.y,
      this.pGraphics.width + this.selectedBorderWidth,
      this.pGraphics.height + this.selectedBorderWidth
    );
    pop();

    push();
    if (this.selected) {
      fill(selectedColour);
      noStroke();
      rect(
        this.position.x,
        this.position.y,
        this.pGraphics.width + this.selectedBorderWidth,
        this.pGraphics.height + this.selectedBorderWidth
      );
    }
    pop();

    imageMode(CENTER);
    image(this.pGraphics, this.position.x, this.position.y);
    this.pGraphics.background(255);
    if (this.savedDoodle != undefined) {
      this.pGraphics.blend(
        this.savedDoodle,
        0,
        0,
        this.savedDoodle.width,
        this.savedDoodle.height,
        0,
        0,
        floor(this.pGraphics.width),
        floor(this.pGraphics.height),
        DARKEST
      );

      this.pGraphics.image(
        this.savedDoodle,
        this.position.x,
        this.position.y,
        this.pGraphics.width,
        this.pGraphics.height
      );
    }

    if (this.enableDraw) {
      for (let i = 0; i < this.mousePositions.length; i++) {
        this.pGraphics.push();
        this.pGraphics.fill(0);

        this.pGraphics.rectMode(CENTER);
        this.pGraphics.square(
          this.mousePositions[i].x,
          this.mousePositions[i].y,
          brushSize
        );

        this.pGraphics.pop();
      }
    }
  }

  checkBounds() {
    let boundsLeft = this.position.x - this.pGraphics.width / 2;
    let boundsRight = this.position.x + this.pGraphics.width / 2;
    let boundsTop = this.position.y - this.pGraphics.height / 2;
    let boundsBottom = this.position.y + this.pGraphics.height / 2;

    if (
      mouseX > boundsLeft &&
      mouseX < boundsRight &&
      mouseY < boundsBottom &&
      mouseY > boundsTop
    ) {
      this.mouseOver = true;
    } else {
      this.mouseOver = false;
    }
  }
}

class Blob {
  constructor(src, concavity, resolution) {
    // optional:
    // concavity determines how tightly the
    // the outline will keep to the blob
    // lower = more accurate but slower
    this.concavity = concavity || 20;

    // optional:
    // normally we'd look at every pixel in
    // the image, but changing this will
    // decrease the resolution for faster
    // processing
    // 1 = every pixel (default)
    // 2 = every other, etc
    this.resolution = resolution || 1;

    // blob variables
    this.w = undefined;
    this.h = undefined;
    this.outline = undefined; // outline of the blob
    this.convexHull = undefined; // convex hull (outline with no concavity)
    this.bbox = undefined; // bounding box too

    // find the blobs!
    this.getOutline(src);

    // calculate centroid and bounding box using
    // the convex hull points
    this.getCentroid(this.convexHull);
    this.getBoundingBox(this.convexHull);

    // calculate the area
    // (using either the outline or convex hull)
    this.area = this.getArea(this.outline);
  }

  // use hull.js to get the outline of the blob!
  getOutline(src) {
    // get all the black pixels in the image
    src.loadPixels();
    let pts = [];
    for (let y = 0; y < src.height; y += this.resolution) {
      for (let x = 0; x < src.width; x += this.resolution) {
        let index = (y * src.width + x) * 4;
        if (src.pixels[index] < 127) {
          pts.push([x, y]);
        }
      }
    }

    // get the outline and convex hull!
    this.outline = hull(pts, this.concavity);
    this.convexHull = hull(pts, Infinity);

    // hull.js gives us points as [ x, y ]
    // convert to vector array instead
    for (let i = 0; i < this.outline.length; i++) {
      this.outline[i] = createVector(this.outline[i][0], this.outline[i][1]);
    }
    for (let i = 0; i < this.convexHull.length; i++) {
      this.convexHull[i] = createVector(
        this.convexHull[i][0],
        this.convexHull[i][1]
      );
    }
  }

  // calculate the center of the blob
  // via: https://bell0bytes.eu/centroid-convex
  getCentroid(pts) {
    let centroidX = 0;
    let centroidY = 0;
    let determinant = 0;
    let j = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i + 1 === pts.length) {
        j = 0;
      } else {
        j = i + 1;
      }

      let tempDeterminant = pts[i].x * pts[j].y - pts[j].x * pts[i].y;
      determinant += tempDeterminant;

      centroidX += (pts[i].x + pts[j].x) * tempDeterminant;
      centroidY += (pts[i].y + pts[j].y) * tempDeterminant;
    }

    centroidX /= 3 * determinant;
    centroidY /= 3 * determinant;

    this.centroid = createVector(centroidX, centroidY);
  }

  // calculate the bounding box of the blob
  getBoundingBox(pts) {
    let minX = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let minY = Number.MAX_VALUE;
    let maxY = Number.MIN_VALUE;
    for (let pt of pts) {
      if (pt.x < minX) {
        minX = pt.x;
      } else if (pt.x > maxX) {
        maxX = pt.x;
      }
      if (pt.y < minY) {
        minY = pt.y;
      } else if (pt.y > maxY) {
        maxY = pt.y;
      }
    }
    this.bbox = {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    };
  }

  // calculate area using the shoelace formula
  // (can pass in the outline or convex hull)
  getArea(pts) {
    let sum1 = 0;
    let sum2 = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      sum1 = sum1 + pts[i].x * pts[i + 1].y;
      sum2 = sum2 + pts[i].y * pts[i + 1].x;
    }
    sum1 = sum1 + pts[pts.length - 1].x * pts[0].y;
    sum2 = sum2 + pts[0].x * pts[pts.length - 1].y;
    return abs(sum1 - sum2) / 2;
  }
}

function song(time) {
  for (let i = 0; i < instruments.length; i++) {
    playInstrument[i] = instrumentPattern[i][counter];
  }

  for (let i = 0; i < instruments.length; i++) {
    if (playInstrument[i]) {
      if (i == 0) {
        instrumentFrequency[i][counter] = instrumentFrequency[i][counter].slice(
          0,
          1
        );
        instruments[i].triggerAttackRelease(
          `${instrumentFrequency[i][counter]}1`,
          instrumentDuration[i][counter],
          time,
          1
        );
      } else if (i == 1) {
        instruments[i].set({
          frequency: `${instrumentFrequency[i][counter]}`,
        });
        instruments[i].triggerAttackRelease(
          instrumentDuration[i][counter],
          time,
          0.3
        );
      } else if (i == 2) {
        // console.log( instruments[i].oscillator.type);
        instruments[i].triggerAttackRelease(
          `${instrumentFrequency[i][counter]}`,
          instrumentDuration[i][counter],
          time,
          1
        );
      } else if (i == 3) {
        instruments[i].triggerAttackRelease(
          `${instrumentFrequency[i][counter]}`,
          instrumentDuration[i][counter],
          time,
          0.1
        );
      } else if (i == 4) {
        instruments[i].triggerAttackRelease(
          `${instrumentFrequency[i][counter]}`,
          instrumentDuration[i][counter],
          time,
          1
        );
      }
    }
  }

  counter = (counter + 1) % beatCount;
}
