const Layer = require('./Layer');

const argb2int = require('../../../lib/helpers/argb2int');

class TestPatternLayer extends Layer {

  /**
   * @constructor
   * @param {Blender} blender a reference to the layer blender
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   * @param {Effect[]} [effects=[]] an optional array of effects to apply to the layer
  */
  constructor(blender, options, effects) {
    super(blender, options, effects);

    this.render();
  }


  /**
   * @description
   * Render the pixel data
   */
  render() {
    this.beginRender();
    try {
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
    } finally {
      this.endRender();
    }
  }
}

module.exports = TestPatternLayer;
