const Layer = require('./Layer');
const rgb2int = require('../../../lib/helpers/rgb2Int');

class KnightRiderLayer extends Layer {
  /**
   * @constructor
   *
   * @param {number} width the width of the layer
   * @param {number} height the height of the layer
   * @param {string} [name="new solid color layer"] an optional name for the layer
   * @param {object} options options for this layer type
   */
  constructor(width, height, name = 'new knight rider layer', options) {
    super(width, height, name);

    this._sweepDuration = 2000;

    this._xPos = 0;

    this._color = options && options.color ? options.color : rgb2int(255, 0, 0);
    this._fps = options && options.fps ? options.fps : 30;

    this._sweepRight = true;
    this._sweepFrame = 0;
    this._updateFrameInterval = setInterval(this.updateFrame.bind(this), 1000 / this.fps);
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
   * The frames per second (fps) that this animation should run
   *
   * @type {number}
   */
  get fps() { return this._fps; }


  /**
   * @description
   * Calculate the next frame data
   */
  async updateFrame() {
    if (this.updatingFrame) {
      console.log('KnightRiderLayer.nextFrame() - Skipped Frame: already updating frame.');
      return;
    }

    await this.waitForRender();

    this._updatingFrame = true;
    try {
      this._sweepFrame += 1;
      if (this._sweepFrame > this.width) {
        this._sweepFrame = 0;
        this._sweepRight = !this._sweepRight;
      }

      this._xPos = this._sweepRight ? this._sweepFrame : this.width - this._sweepFrame;
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
      console.log(this._pixelData);
    } finally {
      this.endRender();
    }
  }

}

module.exports = KnightRiderLayer;
