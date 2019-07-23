const { easeInOutQuad } = require('js-easing-functions');

const Layer = require('./Layer');
const argb2int = require('../../../lib/helpers/argb2int');

class KnightRiderLayer extends Layer {

  /**
   * @constructor
   * @param {Blender} blender a reference to the layer blender
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   * @param {Effect[]} [effects=[]] an optional array of effects to apply to the layer
   */
  constructor(blender, options, effects) {
    super(blender, options, effects);

    this._sweepDuration = options.sweepDuration || 2000;
    this._color = options && options.color ? options.color : argb2int(255, 255, 0, 0);

    this._xPos = 0;

    // Update speed is basically the number of pixels we need to traverse by the sweep duration
    this._updateDelay = (this._sweepDuration / 2) / this.width;
    this._frameNo = 0;

    this._sweepRight = true;
    this._updateFrameInterval = setInterval(this.updateFrame.bind(this), this._updateDelay);
  }


  /**
   * @description
   * Returns true if the frame data is being updated (not the render)
   *
   * @type {boolean}
   */
  get updatingFrame() { return this._updatingFrame; }


  /**
   * @description
   * Calculate the next frame data
   */
  async updateFrame() {
    if (this.updatingFrame) {
      console.log('KnightRiderLayer.updateFrame() - Skipped Frame: already updating frame.');
      return;
    }

    await this.waitForRender();

    this._updatingFrame = true;
    try {
      // Change Direction
      if (this._frameNo >= (this.width)) {
        this._sweepRight = !this._sweepRight;
        this._frameNo = 0;
      }

      this._xPos = Math.round(easeInOutQuad(this._frameNo, 0, this.width - 1, 10));
      if (!this._sweepRight) {
        this._xPos = this.width - 1 - this._xPos;
      }

      this._frameNo += 1;

      this.render();
    } finally {
      this._updatingFrame = false;
    }
  }


  /**
   * @description
   * Render the pixel data
   */
  render() {
    // Can't render twice at the same time. Bail and warn about skipping frames.
    if (this.rendering) {
      console.warn('KnightRiderLayer: Skipped render - already rendering pixel data.');
      return;
    }

    this.beginRender();
    try {
      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          this._pixelData[(y * this.width) + x] = this._xPos === x ? this._color : 0x00000000;
        }
      }
    } finally {
      this.endRender();
    }
  }

}

module.exports = KnightRiderLayer;
