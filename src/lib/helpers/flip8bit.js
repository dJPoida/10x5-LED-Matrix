/**
 * @description
 * Flips the bits in an 8bit integer
 *
 * i.e. 01001011 becomes 11010010
 * @param {number} val
 *
 * @returns {number}
 */
const flip8bit = val => (
  ((val & 0x1) << 7) |
  ((val & 0x2) << 5) |
  ((val & 0x4) << 3) |
  ((val & 0x8) << 1) |
  ((val >> 1) & 0x8) |
  ((val >> 3) & 0x4) |
  ((val >> 5) & 0x2) |
  ((val >> 7) & 0x1)
);

module.exports = flip8bit;
