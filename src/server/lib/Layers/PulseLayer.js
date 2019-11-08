const { easeInOutQuad } = require('js-easing-functions');
const { performance } = require('perf_hooks');

// eslint-disable-next-line no-unused-vars
const Scene = require('../Scene');
const Layer = require('./Layer');
const FillLayer = require('./FillLayer');

const setAlpha = require('../../../lib/helpers/setAlpha');


/**
 * @class PulseLayer
 *
 * @description
 * The Pulse Layer pulses a single color from 0% opacity to 100% opacity.
 *
 * Options:
 *  `duration` {number} default = 1000
 *  The duration in milliseconds it should take the pulse to go from 0% to 100% and back to 0%
 *
 *  `color` {number} default = 0xFFFFFF
 *  A 24bit (non alpha) color for the layer
 */
class PulseLayer extends FillLayer {

  /**
   * @constructor
   *
   * @param {Scene} scene a reference to the layer scene
   * @param {string} [name = 'New Pulse Layer'] a unique name to use when identifying the layer
   * @param {number | Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC} [layerStateUpdateInterval = Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC] how often the layer state should be updated
   * @param {{
   *  color: number,
   *  duration: number,
   * }} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(scene, name = 'New Pulse Layer', layerStateUpdateInterval = Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC, options = {}) {
    super(scene, name, layerStateUpdateInterval, {
      duration: 2000,
      color: 0xFFFFFF,
      ...options,
    });

    this._opacity = 0;
    this._internalColor = setAlpha(this.options.color, this._opacity);
    this._tweenStartTime = performance.now();
    this._tweenDirection = true;
  }


  /**
   * @description the current color of the layer
   * @type {number} a 32bit integer representing the ARGB value of the color
   */
  get color() { return this._internalColor; }


  /**
   * @description the duration the tween should take from in to out and back in
   * @type {number} a millisecond value
   */
  get duration() { return this.options.duration; }


  /**
   * @inheritdoc
   */
  async updateLayerState() {
    if (!super.updateLayerState()) return false;

    this.beginUpdatingLayerState();
    let invalidated = false;
    try {
      const oldOpacity = this._opacity;

      let currentTweenTimeElapsed = performance.now() - this._tweenStartTime;
      if (currentTweenTimeElapsed > (this.duration / 2)) {
        // Reset the duration
        this._tweenStartTime = performance.now() - (currentTweenTimeElapsed - (this.duration / 2));
        currentTweenTimeElapsed = performance.now() - this._tweenStartTime;

        // Switch directions
        this._tweenDirection = !this._tweenDirection;
      }

      this._opacity = Math.round(easeInOutQuad(currentTweenTimeElapsed, 0, 255, (this.duration / 2)));
      if (!this._tweenDirection) {
        this._opacity = 255 - this._opacity;
      }

      invalidated = (this._opacity !== oldOpacity);

      // Don't bother re-calculating the internal color unless the opacity has changed
      if (invalidated) {
        this._internalColor = setAlpha(this.options.color, this._opacity);
      }
    } finally {
      this.endUpdatingLayerState(invalidated);
    }

    return true;
  }
}

module.exports = PulseLayer;
