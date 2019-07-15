const argb2int = require('./argb2int');
const int2argb = require('./int2argb');
const argbBlend = require('./argbBlend');

// TODO: actually implement this as a jest test

console.log('argbBlend Test');

const white_100 = {
  a: 255, r: 255, g: 255, b: 255,
};

const black_100 = {
  a: 255, r: 0, g: 0, b: 0,
};

const red_100 = {
  a: 255, r: 255, g: 0, b: 0,
};

const red_50 = {
  a: 127, r: 255, g: 0, b: 0,
};

const colorsToBlend = [
  [black_100, red_100],
  [white_100, red_100],
  [white_100, red_50],
];

console.log('=== TEST ===');
const oneColor = white_100;
const oneColorInt = argb2int(oneColor.a, oneColor.r, oneColor.g, oneColor.b);
console.log(oneColor);
console.log(oneColorInt);
console.log(int2argb(oneColorInt));

colorsToBlend.forEach((blend) => {
  // console.log(argb2int(blend[1].a, blend[1].r, blend[1].g, blend[1].b));
  blend[2] = int2argb(argbBlend(argb2int(blend[0].a, blend[0].r, blend[0].g, blend[0].b), argb2int(blend[1].a, blend[1].r, blend[1].g, blend[1].b)));
  console.table(blend);
});
