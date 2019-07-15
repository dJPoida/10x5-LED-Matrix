const int2argb = require('./int2argb');
const argb2int = require('./argb2int');

/**
 * @description
 * Blends two ARGB pixel values together (using additive)
 *
 * @see https://gist.github.com/JordanDelcros/518396da1c13f75ee057
 *
 * @param {number} baseColor a 32bit color to use as the base color
 * @param {number} addedColor a 32bit color to overlay over the base color
 */
const argbBlend = (baseColor, addedColor) => {
  const base = int2argb(baseColor);
  const added = int2argb(addedColor);
  const result = {
    a: 0x00, r: 0x00, g: 0x00, b: 0x00,
  };

  base.a /= 255;
  added.a /= 255;

  result.a = 1 - (1 - (added.a)) * (1 - base.a);
  result.r = Math.round((added.r * added.a / result.a) + (base.r * base.a * (1 - added.a) / result.a)); // red
  result.g = Math.round((added.g * added.a / result.a) + (base.g * base.a * (1 - added.a) / result.a)); // green
  result.b = Math.round((added.b * added.a / result.a) + (base.b * base.a * (1 - added.a) / result.a)); // blue

  result.a *= 255;

  return argb2int(result.a, result.r, result.g, result.b);
};

module.exports = argbBlend;
