const Layer = require('./Layer');

const fill = require('../../../lib/helpers/fill');


/**
 * @class FillLayer
 *
 * @description
 * The Fill Layer is as simple as they come. Fill the screen entirely with a color.
 *
 * Options:
 *  `color` {number} default = 0x00000000
 *  The 32bit color to fill the layer
 */
class FillLayer extends Layer {
  /**
   * @constructor
   * @param {Scene} scene a reference to the layer scene
   * @param {string} [name = 'New Fill Layer'] a unique name to use when identifying the layer
   * @param {number | Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC} [layerStateUpdateInterval = null] how often the layer state should be updated
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(scene, name = 'New Knight Rider Layer', layerStateUpdateInterval = null, options = {}) {
    super(scene, name, layerStateUpdateInterval, {
      color: 0x00000000,
      ...options,
    });
  }


  /**
   * @description the color of this solid color layer
   * @type {number} a 32bit integer representing the ARGB value of the layer
   */
  get color() { return this.options.color; }


  /**
   * @inheritdoc
   */
  updatePixelData() {
    if (!super.updatePixelData()) return false;

    this.beginUpdatingPixelData();
    try {
      this._pixelData = fill(this.numLEDs, this.color);
    } finally {
      this.endUpdatingPixelData();
    }

    return true;
  }
}

module.exports = FillLayer;
