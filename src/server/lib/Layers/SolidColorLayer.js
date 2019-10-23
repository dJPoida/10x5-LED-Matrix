const Layer = require('./Layer');

const fill = require('../../../lib/helpers/fill');

class SolidColorLayer extends Layer {
  /**
   * @constructor
   * @param {Blender} blender a reference to the layer blender
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(blender, options) {
    super(blender, options);

    this._color = options.color || 0x00000000;
  }


  /**
   * @description the color of this solid color layer
   * @type {number} a 32bit integer representing the ARGB value of the layer
   */
  get color() { return this._color; }

  set color(value) { this._color = value; this.invalidate(); }


  /**
   * @inheritdoc
   */
  compose() {
    // Can't compose twice at the same time. Bail and warn about skipping.
    if (this.composing) {
      console.warn(`${this.name}: Skipped compose() - already composing pixel data.`);
      return;
    }

    if (!this.invalidated) return;

    this.beginComposing();
    try {
      this._pixelData = fill(this.numLEDs, this._color);
    } finally {
      this.endComposing();
    }
  }
}

module.exports = SolidColorLayer;
