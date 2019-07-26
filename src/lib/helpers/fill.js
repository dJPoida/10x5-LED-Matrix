/**
 * @description
 * Fills a pixel data buffer (UInt32Array) with a single color
 *
 * @param {number} numPixels the number of pixels (width / height) to fill
 * @param {number} color the 32bit ARGB color to fill the buffer
 */
const fill = (numPixels, color) => new Uint32Array(numPixels).fill(color);

module.exports = fill;
