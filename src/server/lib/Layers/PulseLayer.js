const { easeInOutQuad } = require('js-easing-functions');
const Layer = require('./Layer');
const argb2int = require('../../../lib/helpers/argb2int');
const int2rgb = require('../../../lib/helpers/int2rgb');

class PulseLayer extends Layer {
  /**
   * @constructor
   * @param {Blender} blender a reference to the layer blender
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(blender, options) {
    super(blender, options);

    this._color = int2rgb(options.color || 0xFFFFFF);
    this._duration = options.duration || 1000;
    this._granularity = options.granularity || 16;
    this._totalFrames = (256 / this._granularity);

    this._frameNo = 0;
    this._pulseDirection = true;

    this._internalColor = 0x00000000;
    this._updateDelay = Math.round((this._duration / 2) / this._totalFrames);

    console.log('Puls Layer Deets: ', {
      color: this._color,
      duration: this._duration,
      granularity: this._granularity,
      totalFrames: this._totalFrames,
      updateDelay: this._updateDelay,
    });

    this._updateFrameInterval = setInterval(this.updateFrame.bind(this), this._updateDelay);
  }


  /**
   * @description the color of this solid color layer
   * @type {number} a 32bit integer representing the ARGB value of the layer
   */
  get color() { return this._color; }

  set color(value) { this._color = value; this.render(); }


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
      console.log('PulseLayer.updateFrame() - Skipped Frame: already updating frame.');
      return;
    }

    await this.waitForRender();

    this._updatingFrame = true;
    try {
      // Change The Opacity

      if (this._frameNo > this._totalFrames) {
        this._frameNo = 0;
        this._pulseDirection = !this._pulseDirection;
      }

      let opacity = Math.round(easeInOutQuad(this._frameNo, 0, 255, this._totalFrames));
      if (!this._pulseDirection) {
        opacity = 255 - opacity;
      }

      // TODO: turn this into a simpler opacity integer bitwise shifting function
      this._internalColor = argb2int(opacity, this._color.r, this._color.g, this.color.b);

      this._frameNo += 1;

      this.render();
    } finally {
      this._updatingFrame = false;
    }
  }


  /**
   * @description
   * Render the solid colour to the pixel data
   */
  render() {
    this.beginRender();
    try {
      for (let p = 0; p < this.width * this.height; p += 1) {
        this._pixelData[p] = this._internalColor;
      }
    } finally {
      this.endRender();
    }
  }
}

module.exports = PulseLayer;
