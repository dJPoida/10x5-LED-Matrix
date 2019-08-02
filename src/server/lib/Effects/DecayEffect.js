const Effect = require('./Effect');
const multiplyAlpha = require('../../../lib/helpers/multiplyAlpha');
const argbBlend = require('../../../lib/helpers/argbBlend');

const DEFAULT_DECAY_FRAMES = 2;

class DecayEffect extends Effect {
  /**
   * @constructor
   *
   * @param {object} options
   */
  constructor(options) {
    super(options);

    options = options || {};

    this._frames = options.frames || DEFAULT_DECAY_FRAMES;

    this._frameDrop = Math.max(Math.min((1 - Math.round(255 / (this.frames + 1)) / 255), 1), 0).toFixed(2);
    console.log('frameDrop:', this._frameDrop);

    this._previousPixelData = undefined;
  }


  /**
   * @description
   * The number of frames the decay effect applies to
   *
   * @type {number}
   */
  get frames() { return this._frames; }


  /**
   * @description
   * Apply the affect to the incoming pixel data
   *
   * @param {Uint32Array} pixelData the pixels to apply the affect to
   */
  apply(pixelData) {
    let returnPixelData = new Uint32Array(pixelData);

    if (this._previousPixelData) {
      const fadedPixelData = this._previousPixelData.map(pixel => multiplyAlpha(pixel, this._frameDrop));
      returnPixelData = fadedPixelData.map((pixel, index) => argbBlend(pixel, pixelData[index]));
    }

    this._previousPixelData = new Uint32Array(returnPixelData);

    return returnPixelData;
  }
}

module.exports = DecayEffect;
