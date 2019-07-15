/**
 * @class Layer
 */
const Layer = class {

  /**
   * @constructor
   * @param {string | number} id the id of the new layer
   * @param {number} width the width of the new layer
   * @param {number} height the height of the new layer
   * @param {string} [name="new layer"] an optional name for the layer 
   */
  constructor(id, width, height, name="new layer") {
    console.log(`New layer (${width}, ${height})`);
    this._id = String(id),
    this._name = name;
    this._width = width;
    this._height = height;
    this._pixelData = new Uint32Array(width * height);
  }


  /**
   * @type {string}
   */
  get id() { return this._id; }


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
   * @type {string}
   */
  get name() { return this._name; }


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
