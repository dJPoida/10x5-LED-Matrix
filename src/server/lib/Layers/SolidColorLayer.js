const Layer = require('./Layer');

class SolidColorLayer extends Layer {
  /**
   * @constructor
   *
   * @param {number} width the width of the layer
   * @param {number} height the height of the layer
   * @param {string} [name="new solid color layer"] an optional name for the layer
   * @param {object} options options for this layer type
   */
  constructor(width, height, name = 'new solid color layer', options) {
    super(width, height, name, options);

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
