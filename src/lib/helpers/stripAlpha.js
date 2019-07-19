/* eslint-disable no-mixed-operators */
const rgb2int = require('./rgb2Int');

/**
 * @description
 * Converts a 32bit integer value to a 24bit integer value, effectively ignoring the alpha value
 *
 * @param {number} pixelValue a 32bit integer containing alpha, red, green and blue data
 *
 * @returns {number} a 24bit integer containing red, green and blue data
 */
const stripAlpha = (pixelValue) => {
  const r = (pixelValue >> 16 & 0xFF);
  const g = (pixelValue >> 8 & 0xFF);
  const b = (pixelValue & 0xFF);
  return rgb2int(r, g, b);
};

module.exports = stripAlpha;
