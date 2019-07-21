const Layer = require('./Layer');

const argb2int = require('../../../lib/helpers/argb2int');

class TestPatternLayer extends Layer {
  /**
   * @constructor
   *
   * @param {number} width the width of the layer
   * @param {number} height the height of the layer
   * @param {string} [name="new solid color layer"] an optional name for the layer
   */
  constructor(width, height, name = 'new test pattern layer') {
    super(width, height, name);

    this._render();
  }


  /**
   * @inheritDoc
   */
  _render() {
    // Top Left Pixel: RED
    this.setPixel(0, 0, argb2int(255, 255, 0, 0));
    this.setPixel(1, 1, argb2int(128, 255, 0, 0));

    // Top Right Pixel: GREEN
    this.setPixel(this.width - 1, 0, argb2int(255, 0, 255, 0));
    this.setPixel(this.width - 2, 1, argb2int(128, 0, 255, 0));

    // Bottom Right Pixel: BLUE
    this.setPixel(this.width - 1, this.height - 1, argb2int(255, 0, 0, 255));
    this.setPixel(this.width - 2, this.height - 2, argb2int(128, 0, 0, 255));

    // Bottom Left Pixel: WHITE
    this.setPixel(1, this.height - 2, argb2int(128, 255, 255, 255));
    this.setPixel(0, this.height - 1, argb2int(255, 255, 255, 255));
  }
}

module.exports = TestPatternLayer;
