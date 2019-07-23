const Layer = require('./Layer');

class SolidColorLayer extends Layer {
  /**
   * @constructor
   * @param {Blender} blender a reference to the layer blender
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   * @param {Effect[]} [effects=[]] an optional array of effects to apply to the layer
   */
  constructor(blender, options, effects) {
    super(blender, options, effects);

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
      for (let p = 0; p < this.width * this.height; p += 1) {
        this._pixelData[p] = this._color;
      }
    } finally {
      this.endRender();
    }
  }
}

module.exports = SolidColorLayer;
