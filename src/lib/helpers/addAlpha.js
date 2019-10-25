const argb2int = require('./argb2int');

/**
 * @description
 * Adds or subtracts an alpha value from a pixel. Limits the output to 0-255.
 *
 * @param {number} pixelValue a 32bit integer containing alpha, red, green and blue data
 * @param {number} value a number between -255 and 255 to add or remove from the alpha channel
 *
 * @returns {number}
 */
const addAlpha = (pixelValue, value) => {
  const alpha = ((pixelValue >>> 24) & 0xFF);
  const newAlpha = Math.round(Math.min(Math.max((alpha + value), 0), 255));
  return argb2int(
    newAlpha,
    ((pixelValue >> 16) & 0xFF),
    ((pixelValue >> 8) & 0xFF),
    (pixelValue & 0xFF),
  );
};

module.exports = addAlpha;
