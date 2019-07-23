class Effect {
  /**
   * @constructor
   *
   * @param {Layer} layer
   * @param {object} options
   */
  constructor(layer, options) {
    this._layer = layer;
  }


  /**
   * @type {Layer}
   */
  get layer() { return this._layer; }


  /**
   * @description
   * Apply the affect to the incoming pixel data
   *
   * @param {Uint32Array} pixelData the pixels to apply the affect to
   */
  apply(pixelData) {
    return new Uint32Array(pixelData);
  }
}

module.exports = Effect;
