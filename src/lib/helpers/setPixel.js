/**
 * @description
 * Sets the alpha value of a pixel. Limits the output to 0-255.
 *
 * @param {Uint32Array} pixelData the array of pixels to use as the source pixel data
 * @param {number} x the x coordinate of the pixel to set
 * @param {number} y the y coordinate of the pixel to set
 * @param {number} width the number of pixels per row on the display
 * @param {number} color an ARGB value
 *
 * @returns {Uint32Array} the updated pixel data
 */
const setPixel = (pixelData, x, y, width, color) => {
  const newPixelData = new Uint32Array(pixelData);
  newPixelData[(y * width) + x] = color;
  return newPixelData;
};

module.exports = setPixel;
