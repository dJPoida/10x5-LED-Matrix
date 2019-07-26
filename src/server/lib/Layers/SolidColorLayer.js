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
    this.render();
  }


  /**
   * @description the color of this solid color layer
   * @type {number} a 32bit integer representing the ARGB value of the layer
   */
  get color() { return this._color; }

  set color(value) { this._color = value; this.render(); }


  /**
   * @description
   * Render the solid colour to the pixel data
   */
  render() {
    this.beginRender();
    try {
      this._pixelData = fill(this.numLEDs, this._color);
    } finally {
      this.endRender();
    }
  }
}

module.exports = SolidColorLayer;
