const Layer = require('./Layer');

class MonoPixelMapLayer extends Layer {
  /**
   * @constructor
   * @param {Blender} blender a reference to the layer blender
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(blender, options = {}) {
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
    this.beginComposing();
    try {
      this.setPixel(3, 0, this.color);
      this.setPixel(4, 0, this.color);
      this.setPixel(5, 0, this.color);
      this.setPixel(6, 0, this.color);

      this.setPixel(2, 1, this.color);
      this.setPixel(3, 1, this.color);
      this.setPixel(4, 1, this.color);
      this.setPixel(5, 1, this.color);
      this.setPixel(6, 1, this.color);
      this.setPixel(7, 1, this.color);

      this.setPixel(2, 2, this.color);
      this.setPixel(4, 2, this.color);
      this.setPixel(5, 2, this.color);
      this.setPixel(7, 2, this.color);

      this.setPixel(2, 3, this.color);
      this.setPixel(3, 3, this.color);
      this.setPixel(4, 3, this.color);
      this.setPixel(5, 3, this.color);
      this.setPixel(6, 3, this.color);
      this.setPixel(7, 3, this.color);

      this.setPixel(2, 4, this.color);
      this.setPixel(4, 4, this.color);
      this.setPixel(5, 4, this.color);
      this.setPixel(7, 4, this.color);

    } finally {
      this.endComposing();
    }
  }
}

module.exports = MonoPixelMapLayer;
