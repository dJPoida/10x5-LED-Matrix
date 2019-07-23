const Effect = require('./Effect');

class DecayEffect extends Effect {
  /**
   * @constructor
   *
   * @param {Layer} layer
   * @param {object} options
   */
  constructor(layer, options) {
    super(layer, options);

    this._frames = options.frames || 5;

    this._frameDrop = Math.round(255 / (options.frames + 1));
  }


  /**
   * @description
   * Apply the affect to the incoming pixel data
   *
   * @param {Uint32Array} pixelData the pixels to apply the affect to
   */
  apply(pixelData) {
    const newPixelData = super.apply(pixelData);

    // TODO: apply the effect here

    return newPixelData;
  }
}

module.exports = DecayEffect;
