/* eslint-disable no-mixed-operators */

/**
 * @description
 * Converts a 24bit integer into red, green and blue channel values (0-255)
 *
 * @param {number} pixelValue a 24bit integer containing red, green, and blue data
 *
 * @returns {{r: number, g: number, b: number}}
 */
const int2rgb = pixelValue => ({
  r: (pixelValue >> 16 & 0xFF),
  g: (pixelValue >> 8 & 0xFF),
  b: (pixelValue & 0xFF),
});

module.exports = int2rgb;
