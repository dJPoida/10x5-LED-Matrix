const Layer = require('./Layer');
const rgb2int = require('../../../lib/helpers/rgb2Int');

const LAYER_EVENTS = require('../constants/LayerEvents');

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
    this._sweepRight = true;
    this._sweepFrame = 0;
    this._updateInterval = setInterval(this._nextFrame.bind(this), 1000 / width);

    this.on(LAYER_EVENTS.UPDATED, this._handleUpdated.bind(this));
  }


  /**
   * @description
   * Fired when a layer is updated
   */
  _handleUpdated() {
    this._render();
  }


  /**
   * @description
   * Calculate the next frame data
   */
  _nextFrame() {
    this._sweepFrame += 1;
    if (this._sweepFrame > this.width) {
      this._sweepFrame = 0;
      this._sweepRight = !this._sweepRight;
    }

    this._xPos = this._sweepRight ? this._sweepFrame : this.width - this._sweepFrame;

    super._nextFrame();
  }


  /**
   * @inheritDoc
   */
  _render() {
    this._updating = true;
    try {
      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          this._pixelData[(y * this.width) + x] = this._xPos === x ? this._color : 0x00000000;
        }
      }
    } finally {
      this._updating = false;
    }
  }

}

module.exports = KnightRiderLayer;
