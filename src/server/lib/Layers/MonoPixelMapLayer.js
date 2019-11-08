const Layer = require('./Layer');

const fill = require('../../../lib/helpers/fill');

/**
 * @class MonoPixelMapLayer
 *
 * @description
 * Displays a BitMap in a single color. The pixel map is interpreted literally
 * as a map of "bits" to be filled with the designated color.
 *
 * Options:
 *  `color` {number} default = 0xFFFFFFFF
 *  The color of the pixel map to render
 *
 *  `pixelMap` {bool[]} default = null
 *  an array of 1/0 boolean values exactly the length of the display height * width
 *  containing the bits to fill with the supplied color.
 *
 *  `pixelMapWidth` {number} default = device horizontal pixel count
 *  the number of horizontal pixels in the provided pixel map
 *
 *  `pixelMapHeight` {number} default = device vertical pixel count
 *  the number of vertical pixels in the provided pixel map
 */
class MonoPixelMapLayer extends Layer {
  /**
   * @constructor
   * @param {Scene} scene a reference to the layer scene
   * @param {string} [name = 'New Mono Pixel Map Layer'] a unique name to use when identifying the layer
   * @param {number | Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC} [layerStateUpdateInterval = null] how often the layer state should be updated
   * @param {{
    *  color: number,
    *  pixelMap: boolean[],
    *  pixelMapWidth: number,
    *  pixelMapHeight: number,
    * }} [options={}] an optional set of options specific to the type of layer being instantiated
    */
  constructor(scene, name = 'New Pixel Map Layer', layerStateUpdateInterval = Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC, options = {}) {
    super(scene, name, layerStateUpdateInterval, {
      color: 0xFFFFFFFF,
      ...options,
    });

    this._options.pixelMapWidth = this.options.pixelMapWidth || this.width;
    this._options.pixelMapHeight = this.options.pixelMapHeight || this.height;
    this._options.pixelMap = this.options.pixelMap || [].fill(false, 0, (this.options.pixelMapHeight * this.options.pixelMapWidth) - 1);
  }


  /**
   * @description the color of pixels rendered by this layer
   * @type {number} a 32bit integer representing the ARGB value of the layer
   */
  get color() { return this.options.color; }


  /**
   * @description the pixel map to render
   * @type {boolean[]} an array of bits to render in the provided color
   */
  get pixelMap() { return this.options.pixelMap; }


  /**
   * @inheritdoc
   */
  updatePixelData() {
    if (!super.updatePixelData()) return false;

    this.beginUpdatingPixelData();
    try {
      // Start with an empty layer
      this._pixelData = fill(this.numLEDs, 0x00000000);

      // Only populate the pixels with the provided color if they exist in the pixel map
      for (let y = 0; y < this.options.pixelMapHeight; y += 1) {
        for (let x = 0; x < this.options.pixelMapWidth; x += 1) {
          this._pixelData[y * this.width + x] = this.pixelMap[y * this.width + x] * this.color;
        }
      }
    } finally {
      this.endUpdatingPixelData();
    }

    return true;
  }
}

module.exports = MonoPixelMapLayer;
