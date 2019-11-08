const Layer = require('./Layer');

const argb2int = require('../../../lib/helpers/argb2int');
const setPixel = require('../../../lib/helpers/setPixel');


/**
 * @class TestPatternLayer
 *
 * @description
 * The Test Pattern Layer is designed to display a RED, GREEN, BLUE and WHITE pixel pattern
 * in the top left, top right, bottom right and bottom left quadrants respectively.
 *
 * Options: (none)
 */
class TestPatternLayer extends Layer {

  /**
   * @param {Scene} scene a reference to the layer scene
   * @param {string} [name = 'New Knight Rider Layer'] a unique name to use when identifying the layer
   * @param {number | Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC} [layerStateUpdateInterval = null] how often the layer state should be updated
   * @param {{}} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(scene, name = 'New Test Pattern Layer', layerStateUpdateInterval = null, options = {}) {
    super(scene, name, layerStateUpdateInterval, { ...options });
  }


  /**
   * @inheritdoc
   */
  updatePixelData() {
    if (!super.updatePixelData()) return false;

    this.beginUpdatingPixelData();
    try {
      // Top Left Pixel: RED
      this._pixelData = setPixel(this._pixelData, 0, 0, this.width, argb2int(255, 255, 0, 0));
      this._pixelData = setPixel(this._pixelData, 1, 1, this.width, argb2int(128, 255, 0, 0));

      // Top Right Pixel: GREEN
      this._pixelData = setPixel(this._pixelData, this.width - 1, 0, this.width, argb2int(255, 0, 255, 0));
      this._pixelData = setPixel(this._pixelData, this.width - 2, 1, this.width, argb2int(128, 0, 255, 0));

      // Bottom Right Pixel: BLUE
      this._pixelData = setPixel(this._pixelData, this.width - 1, this.height - 1, this.width, argb2int(255, 0, 0, 255));
      this._pixelData = setPixel(this._pixelData, this.width - 2, this.height - 2, this.width, argb2int(128, 0, 0, 255));

      // Bottom Left Pixel: WHITE
      this._pixelData = setPixel(this._pixelData, 1, this.height - 2, this.width, argb2int(128, 255, 255, 255));
      this._pixelData = setPixel(this._pixelData, 0, this.height - 1, this.width, argb2int(255, 255, 255, 255));
    } finally {
      this.endUpdatingPixelData();
    }

    return true;
  }
}

module.exports = TestPatternLayer;
