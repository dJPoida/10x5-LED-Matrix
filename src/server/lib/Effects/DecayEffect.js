const { performance } = require('perf_hooks');

const Effect = require('./Effect');
const addAlpha = require('../../../lib/helpers/addAlpha');
const argbBlend = require('../../../lib/helpers/argbBlend');

const DEFAULT_DECAY_DURATION_MS = 500;
const DEFAULT_ALPHA_OFFSET = 0.2;

class DecayEffect extends Effect {

  /**
   * @constructor
   *
   * @param {Layer} layer the layer that owns the effect
   * @param {object} [options={
   *  duration: number,
   *  alphaOffset: number
   * }]
   */
  constructor(layer, options = {}) {
    super(layer, options);

    options = options || {};

    this._duration = Math.max(options.duration || 0, 0) || DEFAULT_DECAY_DURATION_MS;
    this._alphaOffset = Math.max(options.alphaOffset || 0) || DEFAULT_ALPHA_OFFSET;

    this._previousRenderTimeStamp = performance.now();
    this._previousPixelData = (new Uint32Array(layer.numLEDs)).fill(0x00000000);
  }


  /**
   * @description
   * Render the affect onto the incoming pixel data
   *
   * @param {Uint32Array} pixelData the pixels to apply the affect to
   */
  render(pixelData) {
    let returnPixelData = new Uint32Array(pixelData);

    // A pixel must decay from opacity 1 to opacity 0 in the specified duration.

    // Therefore we can take the time since the last render and divide that by the target duration,
    // then use that as the multiplier to determine how much the current frame should have faded
    const newRenderTimestamp = performance.now();
    const tDelta = newRenderTimestamp - this._previousRenderTimeStamp;

    // Reduce the alpha of the previous pixel data (i.e. apply the "decay")
    const alphaDrop = Math.round((tDelta / this._duration) * 255);
    const decayedPixelData = this._previousPixelData.map(pixel => addAlpha(pixel, -alphaDrop));

    // Overlay the new pixel data at the alpha offset and store it for next time
    this._previousPixelData = decayedPixelData.map((pixel, index) => argbBlend(pixel, (
      (this._alphaOffset > 0) ? addAlpha(pixelData[index], -(255 * this._alphaOffset)) : pixelData[index]
    )));

    // Apply the incoming pixel data over the top of the decayed pixel data at full opacity so it doesn't interfere with the display
    returnPixelData = decayedPixelData.map((pixel, index) => argbBlend(pixel, pixelData[index]));

    this._previousRenderTimeStamp = newRenderTimestamp;

    return returnPixelData;
  }
}

module.exports = DecayEffect;
