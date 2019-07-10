const ws281x = require('rpi-ws281x-native');

const COLS = 10;
const ROWS = 5;

const NUM_LEDS = COLS * ROWS;
const pixelData = new Uint32Array(NUM_LEDS);

ws281x.init(NUM_LEDS);
ws281x.setIndexMapping([
  9,  8,  7,  6,  5,  4,  3,  2,  1,  0,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  29, 28, 27, 26, 25, 24, 23, 22, 21, 20,
  30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
  49, 48, 47, 46, 45, 44, 43, 42, 41, 40,
]);
ws281x.setBrightness(192);

// ---- trap the SIGINT and reset before exit
process.on('SIGINT', function () {
  ws281x.reset();
  process.nextTick(function () { process.exit(0); });
});


// ---- animation-loop
var offset = 0;

// Rainbow
/*
setInterval(function () {
  for (let r = 0; r < ROWS; r += 1) {
    for (var c = 0; c < COLS; c += 1) {
      pixelData[r*COLS + c] = colorwheel((offset + r) % 256);
    }
  }
  offset = (offset + 1) % 256;

  ws281x.render(pixelData);
}, 1000 / 60);
*/


// Iteration of each individual LED
setInterval(function () {
  var i=NUM_LEDS;
  while(i--) {
      pixelData[i] = 0;
  }
  pixelData[offset] = 0xffffff;
  //pixelData[offset] = colorwheel((offset + i) % 256);

  offset = (offset + 1) % NUM_LEDS;
  ws281x.render(pixelData);
}, 1000 / 60);
console.log('Press <ctrl>+C to exit.');


// rainbow-colors, taken from http://goo.gl/Cs3H0v
function colorwheel(pos) {
  pos = 255 - pos;
  if (pos < 85) { return rgb2Int(255 - pos * 3, 0, pos * 3); }
  else if (pos < 170) { pos -= 85; return rgb2Int(0, pos * 3, 255 - pos * 3); }
  else { pos -= 170; return rgb2Int(pos * 3, 255 - pos * 3, 0); }
}

function rgb2Int(r, g, b) {
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}