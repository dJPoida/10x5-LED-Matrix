/* eslint-disable no-mixed-operators */

/**
 * @description
 * Converts a 32 bit integer into alpha, red, green and blue channels
 *
 * @param {number} pixelValue a 32bit integer containing alpha, red, green and blue data
 *
 * @returns {{a: alpha, r: number, g: number, b: number}}
 */
const int2argb = pixelValue => ({
  a: (pixelValue >>> 24),
  r: ((pixelValue & 0x00FF0000) >> 16),
  g: ((pixelValue & 0x0000FF00) >> 8),
  b: (pixelValue & 0x000000FF),
});

module.exports = int2argb;
