/* eslint-disable no-bitwise */

/**
 * @description
 * Converts an R, G and B value to a 24bit integer value
 *
 * @param {number} r a red value between 0 and 255
 * @param {number} g a green value between 0 and 255
 * @param {number} b a blue value between 0 and 255
 */
const rgb2Int = (r, g, b) => ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);

module.exports = rgb2Int;
