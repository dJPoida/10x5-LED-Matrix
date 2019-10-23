const argb2int = require('./argb2int');

/**
 * @description
 * Multiplies the alpha value of a pixel by a number. Limits the output to 0-255.
 *
 * @param {number} pixelValue a 32bit integer containing alpha, red, green and blue data
 * @param {number} multiplier a number to multiply the pixel's alpha value by
 *
 * @returns {number}
 */
const multiplyAlpha = (pixelValue, multiplier) => {
  const alpha = ((pixelValue >>> 24) & 0xFF);
  const newAlpha = Math.round(Math.min(Math.max((alpha * multiplier), 0), 255));
  return argb2int(
    newAlpha,
    ((pixelValue >> 16) & 0xFF),
    ((pixelValue >> 8) & 0xFF),
    (pixelValue & 0xFF),
  );
};

module.exports = multiplyAlpha;
