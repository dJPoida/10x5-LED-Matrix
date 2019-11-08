const { easeInOutSine } = require('js-easing-functions');
const { performance } = require('perf_hooks');

// eslint-disable-next-line no-unused-vars
const Scene = require('../Scene');
const Layer = require('./Layer');

const multiplyAlpha = require('../../../lib/helpers/multiplyAlpha');

/**
 * @class KnightRiderLayer
 *
 * @description
 * The Knight Rider Layer sweeps a single line from left to right, just like the Larson Scanner on the Kitt car.
 *
 * Options:
 *  `duration` {number} default = 2000
 *  The duration in milliseconds the sweep should take from left, to right, and back again.
 *
 *  `color` {number} default = 0xFFFF0000
 *  The color of the line
 *
 *  `blend` {boolean} default = true
 *  Whether to blend the line between pixels (aka anti-alias)
 */
class KnightRiderLayer extends Layer {

  /**
   * @constructor
   *
   * @param {Scene} scene a reference to the layer scene
   * @param {string} [name = 'New Knight Rider Layer'] a unique name to use when identifying the layer
   * @param {number | Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC} [layerStateUpdateInterval = Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC] how often the layer state should be updated
   * @param {{
   *  color: number,
   *  duration: number,
   *  blend: boolean,
   * }} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(scene, name = 'New Knight Rider Layer', layerStateUpdateInterval = Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC, options = {}) {
    super(scene, name, layerStateUpdateInterval, {
      duration: 2000,
      color: 0xFFFF0000,
      blend: true,
      ...options,
    });

    this._xPos = 0;
    this._tweenStartTime = performance.now();
    this._tweenDirection = true;
  }


  /**
   * @description the line color
   * @type {number} a 32bit integer representing the ARGB value of the line color
   */
  get color() { return this.options.color; }


  /**
   * @description the duration the tween should take from in to out and back in
   * @type {number} a millisecond value
   */
  get duration() { return this.options.duration; }


  /**
   * @description whether to blend the line as it traverses between pixels or not
   * @type {boolean}
   */
  get blend() { return this.options.blend; }


  /**
   * @inheritDoc
   */
  async updateLayerState() {
    if (!super.updateLayerState()) return false;

    this.beginUpdatingLayerState();
    let invalidated = false;
    try {
      const oldXpos = this._xPos;

      let currentTweenTimeElapsed = performance.now() - this._tweenStartTime;
      if (currentTweenTimeElapsed > (this.duration / 2)) {
        // Reset the duration
        this._tweenStartTime = performance.now() - (currentTweenTimeElapsed - (this.duration / 2));
        currentTweenTimeElapsed = performance.now() - this._tweenStartTime;

        // Switch directions
        this._tweenDirection = !this._tweenDirection;
      }

      this._xPos = easeInOutSine(currentTweenTimeElapsed, 0, this.width - 1, (this.duration / 2)).toFixed(2);
      if (this._tweenDirection) {
        this._xPos = this.width - 1 - this._xPos;
      }

      invalidated = (this._xPos !== oldXpos);
    } finally {
      this.endUpdatingLayerState(invalidated);
    }

    return true;
  }


  /**
   * @inheritdoc
   */
  updatePixelData() {
    if (!super.updatePixelData()) return false;

    this.beginUpdatingPixelData();
    try {
      // When blending is enabled, the current _xPos is blended between two pixels.
      // an X value of 0 renders entirely into pixel 0
      // an x value of 0.5 renders at 50% into pixel 0 and 50% into pixel 1
      // an x value of 0.8 renders at 20% into pixel 1 and 80% into pixel 2

      let x;
      if (this.blend) {
        x = Math.floor(this._xPos);
      } else {
        x = Math.round(this._xPos);
      }
      const x1 = this._xPos % 1;
      const x2 = 1 - x1;

      this._pixelData = (new Uint32Array(this.numLEDs)).fill(0x00000000);

      for (let y = 0; y < this.height; y += 1) {
        if (this.blend) {
          this._pixelData[(y * this.width) + x] = multiplyAlpha(this.color, x2);
          this._pixelData[(y * this.width) + x + 1] = multiplyAlpha(this.color, x1);
        } else {
          this._pixelData[(y * this.width) + x] = this.color;
        }
      }
    } finally {
      this.endUpdatingPixelData();
    }

    return true;
  }

}

module.exports = KnightRiderLayer;
