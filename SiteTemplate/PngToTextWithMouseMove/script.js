(function () {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
      || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function (callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () { callback(currTime + timeToCall); },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
}());

var Nodes = {

  // Settings
  density: 4,

  drawDistance: 1,
  baseRadius: 1,
  maxLineThickness: 1,
  reactionSensitivity: 1,
  lineThickness: 1,

  points: [],
  mouse: { x: -1000, y: -1000, down: false },

  animation: null,

  canvas: null,
  context: null,

  imageInput: null,
  bgImage: null,
  bgCanvas: null,
  bgContext: null,
  bgContextPixelData: null,

  init: function () {
    // Set up the visual canvas 
    this.canvas = document.getElementById('canvas');
    this.context = canvas.getContext('2d');
    this.context.globalCompositeOperation = "lighter";
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.display = 'block'

    this.imageInput = document.createElement('input');
    this.imageInput.setAttribute('type', 'file');
    this.imageInput.style.visibility = 'hidden';
    this.imageInput.addEventListener('change', this.upload, false);
    document.body.appendChild(this.imageInput);

    this.canvas.addEventListener('mousemove', this.mouseMove, false);
    this.canvas.addEventListener('mousedown', this.mouseDown, false);
    this.canvas.addEventListener('mouseup', this.mouseUp, false);
    this.canvas.addEventListener('mouseout', this.mouseOut, false);

    window.onresize = function (event) {
      Nodes.canvas.width = window.innerWidth;
      Nodes.canvas.height = window.innerHeight;
      Nodes.onWindowResize();
    }

        // Load initial input image (the chrome logo!)
    this.loadData('data:image/png;base64,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');
  },

  preparePoints: function () {

    // Clear the current points
    this.points = [];

    var width, height, i, j;

    var colors = this.bgContextPixelData.data;

    for (i = 0; i < this.canvas.height; i += this.density) {

      for (j = 0; j < this.canvas.width; j += this.density) {

        var pixelPosition = (j + i * this.bgContextPixelData.width) * 4;

        // Dont use whiteish pixels
        if (colors[pixelPosition] > 200 && (colors[pixelPosition + 1]) > 200 && (colors[pixelPosition + 2]) > 200 || colors[pixelPosition + 3] === 0) {
          continue;
        }

        var color = 'rgba(' + colors[pixelPosition] + ',' + colors[pixelPosition + 1] + ',' + colors[pixelPosition + 2] + ',' + '1)';
        this.points.push({ x: j, y: i, originalX: j, originalY: i, color: color });

      }
    }
  },

  updatePoints: function () {

    var i, currentPoint, theta, distance;

    for (i = 0; i < this.points.length; i++) {

      currentPoint = this.points[i];

      theta = Math.atan2(currentPoint.y - this.mouse.y, currentPoint.x - this.mouse.x);

      if (this.mouse.down) {
        distance = this.reactionSensitivity * 200 / Math.sqrt((this.mouse.x - currentPoint.x) * (this.mouse.x - currentPoint.x) +
          (this.mouse.y - currentPoint.y) * (this.mouse.y - currentPoint.y));
      } else {
        distance = this.reactionSensitivity * 100 / Math.sqrt((this.mouse.x - currentPoint.x) * (this.mouse.x - currentPoint.x) +
          (this.mouse.y - currentPoint.y) * (this.mouse.y - currentPoint.y));
      }


      currentPoint.x += Math.cos(theta) * distance + (currentPoint.originalX - currentPoint.x) * 0.05;
      currentPoint.y += Math.sin(theta) * distance + (currentPoint.originalY - currentPoint.y) * 0.05;

    }
  },

  drawLines: function () {

    var i, j, currentPoint, otherPoint, distance, lineThickness;

    for (i = 0; i < this.points.length; i++) {

      currentPoint = this.points[i];

      // Draw the dot.
      this.context.fillStyle = currentPoint.color;
      this.context.strokeStyle = currentPoint.color;

      for (j = 0; j < this.points.length; j++) {

        // Distaqnce between two points.
        otherPoint = this.points[j];

        if (otherPoint == currentPoint) {
          continue;
        }

        distance = Math.sqrt((otherPoint.x - currentPoint.x) * (otherPoint.x - currentPoint.x) +
          (otherPoint.y - currentPoint.y) * (otherPoint.y - currentPoint.y));

        if (distance <= this.drawDistance) {

          this.context.lineWidth = (1 - (distance / this.drawDistance)) * this.maxLineThickness * this.lineThickness;
          this.context.beginPath();
          this.context.moveTo(currentPoint.x, currentPoint.y);
          this.context.lineTo(otherPoint.x, otherPoint.y);
          this.context.stroke();
        }
      }
    }
  },

  drawPoints: function () {

    var i, currentPoint;

    for (i = 0; i < this.points.length; i++) {

      currentPoint = this.points[i];

      // Draw the dot.
      this.context.fillStyle = currentPoint.color;
      this.context.strokeStyle = currentPoint.color;

      this.context.beginPath();
      this.context.arc(currentPoint.x, currentPoint.y, this.baseRadius, 0, Math.PI * 2, true);
      this.context.closePath();
      this.context.fill();

    }
  },

  draw: function () {
    this.animation = requestAnimationFrame(function () { Nodes.draw() });

    this.clear();
    this.updatePoints();
    this.drawLines();
    this.drawPoints();

  },

  clear: function () {
    this.canvas.width = this.canvas.width;
  },

  // The filereader has loaded the image... add it to image object to be drawn
  loadData: function (data) {

    this.bgImage = new Image;
    this.bgImage.src = data;

    this.bgImage.onload = function () {

      //this
      Nodes.drawImageToBackground();
    }
  },

  // Image is loaded... draw to bg canvas
  drawImageToBackground: function () {

    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.canvas.width;
    this.bgCanvas.height = this.canvas.height;

    var newWidth, newHeight;

    // If the image is too big for the screen... scale it down.
    if (this.bgImage.width > this.bgCanvas.width - 100 || this.bgImage.height > this.bgCanvas.height - 100) {

      var maxRatio = Math.max(this.bgImage.width / (this.bgCanvas.width - 100), this.bgImage.height / (this.bgCanvas.height - 100));
      newWidth = this.bgImage.width / maxRatio;
      newHeight = this.bgImage.height / maxRatio;

    } else {
      newWidth = this.bgImage.width;
      newHeight = this.bgImage.height;
    }

    // Draw to background canvas
    this.bgContext = this.bgCanvas.getContext('2d');
    this.bgContext.drawImage(this.bgImage, (this.canvas.width - newWidth) / 2, (this.canvas.height - newHeight) / 2, newWidth, newHeight);
    this.bgContextPixelData = this.bgContext.getImageData(0, 0, this.bgCanvas.width, this.bgCanvas.height);

    this.preparePoints();
    this.draw();
  },

  mouseDown: function (event) {
    Nodes.mouse.down = true;
  },

  mouseUp: function (event) {
    Nodes.mouse.down = false;
  },

  mouseMove: function (event) {
    Nodes.mouse.x = event.offsetX || (event.layerX - Nodes.canvas.offsetLeft);
    Nodes.mouse.y = event.offsetY || (event.layerY - Nodes.canvas.offsetTop);
  },

  mouseOut: function (event) {
    Nodes.mouse.x = -1000;
    Nodes.mouse.y = -1000;
    Nodes.mouse.down = false;
  },

  // Resize and redraw the canvas.
  onWindowResize: function () {
    cancelAnimationFrame(this.animation);
    this.drawImageToBackground();
  }
}

setTimeout(function () {
  Nodes.init();
}, 10);




// # base64 -d <<< "$myImgStr" > image2.jpg
// # echo "$myImgStr" | base64 -d > image2.jpg


// base64 --wrap 56 ~/Pictures/book.jpg
// base64 ~/Pictures/book.jpg
// 