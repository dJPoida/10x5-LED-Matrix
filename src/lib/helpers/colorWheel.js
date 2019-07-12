const rgb2Int = require('./rgb2Int');

/**
 * rainbow-colors
 * @see http://goo.gl/Cs3H0v
 *
 * @param {number} pos a number between 0 and 255
 */
const colorwheel = (pos) => {
  pos = 255 - pos;
  if (pos < 85) {
    return rgb2Int(255 - pos * 3, 0, pos * 3);
  }

  if (pos < 170) {
    pos -= 85;
    return rgb2Int(0, pos * 3, 255 - pos * 3);
  }

  pos -= 170;
  return rgb2Int(pos * 3, 255 - pos * 3, 0);
};

module.exports = colorwheel;
