const { easeInOutQuad } = require('js-easing-functions');
const Layer = require('./Layer');
const argb2int = require('../../../lib/helpers/argb2int');
const int2rgb = require('../../../lib/helpers/int2rgb');
const fill = require('../../../lib/helpers/fill');


class PulseLayer extends Layer {
  /**
   * @constructor
   * @param {Blender} blender a reference to the layer blender
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   * @param {Effect[]} [effects=[]] an optional array of effects to apply to the layer
   */
  constructor(blender, options, effects) {
    super(blender, options, effects);

    this._updatingData = false;

    this._color = int2rgb(options.color || 0xFFFFFF);
    this._duration = options.duration || 1000;
    this._granularity = options.granularity || 16;
    this._totalFrames = (256 / this._granularity);

    this._frameNo = 0;
    this._pulseDirection = true;

    this._internalColor = 0x00000000;
    this._updateDelay = Math.round((this._duration / 2) / this._totalFrames);

    console.log('Pulse Layer Deets: ', {
      color: this._color,
      duration: this._duration,
      granularity: this._granularity,
      totalFrames: this._totalFrames,
      updateDelay: this._updateDelay,
    });

    this._updateDataInterval = setInterval(this.updateData.bind(this), this._updateDelay);
  }


  /**
   * @description the color of this solid color layer
   * @type {number} a 32bit integer representing the ARGB value of the layer
   */
  get color() { return this._color; }

  set color(value) { this._color = value; this.invalidate(); }


  /**
   * @description
   * Returns true if the frame data is being updated (not the render)
   *
   * @type {boolean}
   */
  get updatingData() { return this._updatingData; }


  /**
   * @description
   * Calculate the next frame data
   */
  async updateData() {
    await this.waitForComposition();

    if (this.updatingData) {
      console.log('PulseLayer.updateData() - Skipped Frame: already updating frame.');
      return;
    }

    this._updatingData = true;
    try {
      if (this._frameNo > this._totalFrames) {
        this._frameNo = 0;
        this._pulseDirection = !this._pulseDirection;
      }

      // Change The Opacity
      let opacity = Math.round(easeInOutQuad(this._frameNo, 0, 255, this._totalFrames));
      if (!this._pulseDirection) {
        opacity = 255 - opacity;
      }

      // TODO: turn this into a simpler opacity integer bitwise shifting function
      this._internalColor = argb2int(opacity, this._color.r, this._color.g, this.color.b);

      this._frameNo += 1;

      this.invalidate();
    } finally {
      this._updatingData = false;
    }
  }


  /**
   * @inheritdoc
   */
  compose() {
    // Can't compose twice at the same time. Bail and warn about skipping.
    if (this.composing) {
      console.warn(`${this.name}: Skipped compose() - already composing pixel data.`);
      return;
    }

    if (!this.invalidated) return;

    this.beginComposing();
    try {
      this._pixelData = fill(this.numLEDs, this._internalColor);
    } finally {
      this.endComposing();
    }
  }
}

module.exports = PulseLayer;
