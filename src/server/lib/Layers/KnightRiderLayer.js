const { easeInOutSine } = require('js-easing-functions');

// eslint-disable-next-line no-unused-vars
const Scene = require('../Scene');
const Layer = require('./Layer');
const argb2int = require('../../../lib/helpers/argb2int');
const multiplyAlpha = require('../../../lib/helpers/multiplyAlpha');

class KnightRiderLayer extends Layer {

  /**
   * @constructor
   * @param {Scene} scene a reference to the layer scene
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(scene, options = {}) {
    super(scene, options);

    this._updatingData = false;

    this._sweepDuration = options.sweepDuration || 2000;
    this._color = options.color ? options.color : argb2int(255, 255, 0, 0);

    this._xPos = 0;

    this._frameNo = 0;
    this._maxFrames = this.width * 16;
    this._updateDelay = Math.round(this._sweepDuration / this._maxFrames);

    this._sweepRight = true;
    this._updateDataInterval = setInterval(this.updateData.bind(this), this._updateDelay);
  }


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
      console.log('KnightRiderLayer.updateData() - Skipped: already updating data.');
      return;
    }

    this._updatingData = true;
    try {
      const oldXpos = this._xPos;

      // Change Direction
      if (this._frameNo >= (this._maxFrames / 2)) {
        this._sweepRight = !this._sweepRight;
        this._frameNo = 0;
      }

      this._xPos = Math.max(0, Math.min(this.width - 1, easeInOutSine(this._frameNo, 0, (this.width * 2) - 1, (this._maxFrames / 2)) / 2));
      if (!this._sweepRight) {
        this._xPos = this.width - 1 - this._xPos;
      }

      this._frameNo += 1;

      if (this._xPos !== oldXpos) {
        this.invalidate();
      }
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
      // The knight rider layer blends between two pixels.
      // an X value of 0 renders entirely into pixel 0
      // an x value of 0.5 renders at 50% into pixel 0 and 50% into pixel 1
      // an x value of 0.8 renders at 20% into pixel 1 and 80% into pixel 2

      const x = Math.floor(this._xPos);
      const x1 = this._xPos % 1;
      const x2 = 1 - x1;
      // console.log(this._xPos, x, x1.toFixed(2), x2.toFixed(2));

      this._pixelData = (new Uint32Array(this.numLEDs)).fill(0x00000000);

      for (let y = 0; y < this.height; y += 1) {
        this._pixelData[(y * this.width) + x] = multiplyAlpha(this._color, x2);
        this._pixelData[(y * this.width) + x + 1] = multiplyAlpha(this._color, x1);
      }
    } finally {
      this.endComposing();
    }
  }

}

module.exports = KnightRiderLayer;
