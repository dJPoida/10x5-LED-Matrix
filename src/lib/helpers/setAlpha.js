const argb2int = require('./argb2int');

/**
 * @description
 * Sets the alpha value of a pixel. Limits the output to 0-255.
 *
 * @param {number} pixelValue a 24bit or 32bit integer containing red, green, blue (and optionally alpha) data
 * @param {number} value a number between 0 and 255 to set the alpha channel to
 *
 * @returns {number}
 */
const setAlpha = (pixelValue, value) => argb2int(
  Math.round(value),
  ((pixelValue >> 16) & 0xFF),
  ((pixelValue >> 8) & 0xFF),
  (pixelValue & 0xFF),
);

module.exports = setAlpha;
