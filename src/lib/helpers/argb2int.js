/**
 * @description
 * Converts an Alpha, Red, Green and Blue color value to a 32bit integer value
 *
 * @param {number} a an alpha channel value between 0 and 255
 * @param {number} r a red value between 0 and 255
 * @param {number} g a green value between 0 and 255
 * @param {number} b a blue value between 0 and 255
 */
const argb2Int = (a, r, g, b) => ((a & 0xff) << 24) + ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);

module.exports = argb2Int;
