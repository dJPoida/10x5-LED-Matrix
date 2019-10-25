const { easeInOutSine } = require('js-easing-functions');

const Layer = require('./Layer');
const argb2int = require('../../../lib/helpers/argb2int');

class KnightRiderLayer extends Layer {

  /**
   * @constructor
   * @param {Blender} blender a reference to the layer blender
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(blender, options = {}) {
    super(blender, options);

    this._updatingData = false;

    this._sweepDuration = options.sweepDuration || 2000;
    this._color = options && options.color ? options.color : argb2int(255, 255, 0, 0);

    this._xPos = 0;

    this._frameNo = 0;
    this._maxFrames = (this.width * 4);
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

      this._xPos = Math.round(easeInOutSine(this._frameNo, 0, (this.width * 2) - 1, (this._maxFrames / 2)) / 2);
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
      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          this._pixelData[(y * this.width) + x] = this._xPos === x ? this._color : 0x00000000;
        }
      }
    } finally {
      this.endComposing();
    }
  }

}

module.exports = KnightRiderLayer;
