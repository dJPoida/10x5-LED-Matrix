/**
 * @class Layer
 */
const Layer = class {
  constructor(width, height) {
    this._width = width;
    this._height = height;
    this._pixelData = new Uint32Array(this.numLEDs);
  }


  /**
   * @type {number}
   */
  get width() { return this._width; }


  /**
   * @type {number}
   */
  get height() { return this._height; }


  /**
   * @type {Uint32Array}
   */
  get pixelData() { return this._pixelData; }


  /**
   * @description set the color value of a pixel
   * @param {number} x
   * @param {number} y
   * @param {number} color a 32bit color value
   */
  setPixel(x, y, color) {
    this._pixelData[(y * this.width) + x] = color;
  }

};

module.exports = Layer;
