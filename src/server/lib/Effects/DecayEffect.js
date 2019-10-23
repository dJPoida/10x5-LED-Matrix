const Effect = require('./Effect');
const multiplyAlpha = require('../../../lib/helpers/multiplyAlpha');
const argbBlend = require('../../../lib/helpers/argbBlend');

const DEFAULT_DECAY_FRAMES = 2;

class DecayEffect extends Effect {

  /**
   * @constructor
   *
   * @param {Layer} layer the layer that owns the effect
   * @param {object} [options={}]
   */
  constructor(layer, options = {}) {
    super(layer, options);

    options = options || {};

    this._frames = options.frames || DEFAULT_DECAY_FRAMES;

    // Create an array of frame buffers for blending later
    this._frameBuffers = Array(this.frames);
    // Initialise each of the frame buffers
    for (let i = 0; i < this.frames; i += 1) {
      this.frameBuffers[i] = new Uint32Array(this.layer.numLEDs);
    }
    this._currentBuffer = -1;

    // this._frameDrop = Math.max(Math.min((1 - Math.round(255 / (this.frames + 1)) / 255), 1), 0).toFixed(2);
    // console.log('frameDrop:', this._frameDrop);

    // this._previousPixelData = undefined;
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
   * An array of Uint32Array pixel data frame buffers
   *
   * @type {Uint32Array[]}
   */
  get frameBuffers() { return this._frameBuffers; }


  /**
   * @inheritdoc
   */
  apply(pixelData) {
    let returnPixelData = new Uint32Array(this.layer.numLEDs);

    // Determine the next frame buffer
    this._currentBuffer += 1;
    if (this._currentBuffer >= this._frames) this._currentBuffer = 0;

    // Initialize the current buffer to contain the new Pixel Data
    this.frameBuffers[this._currentBuffer] = new Uint32Array(pixelData);

    // iterate over the frame buffers and build up a return buffer using the incremental alpha of each layer
    for (let i = 0; i < this.frames - 1; i += 1) {
      let targetFrameBuffer = this._currentBuffer + i;
      if (targetFrameBuffer >= this.frames) targetFrameBuffer -= this.frames;

      const alpha = (1 / this.frames).toFixed(2) * (i + 1);

      returnPixelData = this.frameBuffers[targetFrameBuffer].map((pixel, index) => argbBlend(returnPixelData[index], multiplyAlpha(pixel, alpha)));
    }

    returnPixelData = this.frameBuffers[this._currentBuffer].map((pixel, index) => argbBlend(returnPixelData[index], pixel));

    return returnPixelData;
  }
}

module.exports = DecayEffect;
