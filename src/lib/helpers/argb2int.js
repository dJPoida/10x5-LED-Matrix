/**
 * @description
 * Converts an Alpha, Red, Green and Blue color value to a 32bit integer value
 *
 * @param {number} a an alpha channel value between 0 and 255
 * @param {number} r a red value between 0 and 255
 * @param {number} g a green value between 0 and 255
 * @param {number} b a blue value between 0 and 255
 */
const argb2int = (a, r, g, b) => (a * (2 ** 24)) + ((r & 0xFF) << 16) + ((g & 0xFF) << 8) + (b & 0xFF);

module.exports = argb2int;
