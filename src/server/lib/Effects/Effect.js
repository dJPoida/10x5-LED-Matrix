/* eslint-disable no-unused-vars */
const Layer = require('../Layers/Layer');

class Effect {

  /**
   * @constructor
   *
   * @param {Layer} layer the layer that owns the effect
   * @param {object} [options={}] any options for the effect
   */
  constructor(layer, options = {}) {
    this._layer = layer;

    if (!this._layer) throw new Error('layer is required for instantiation of an Effect');
  }


  /**
   * @description
   * The layer that this effect is assigned to
   *
   * @type {Layer}
   */
  get layer() { return this._layer; }


  /**
   * @description
   * Apply the affect to the incoming pixel data
   *
   * @param {Layer} layer the layer who owns the pixelData (typically the layer who called the apply function)
   * @param {Uint32Array} pixelData the pixels to apply the affect to
   */
  apply(pixelData) {
    return new Uint32Array(pixelData);
  }
}

module.exports = Effect;
