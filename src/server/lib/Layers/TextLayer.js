const Layer = require('./Layer');
const argb2int = require('../../../lib/helpers/argb2int');
const fonts = require('../../../lib/pixelFonts/fonts');

class TextLayer extends Layer {

  /**
   * @constructor
   * @param {Blender} blender a reference to the layer blender
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(blender, options) {
    super(blender, options);

    this._color = options && options.color ? options.color : argb2int(255, 255, 255, 255);
    this._font = options && options.font ? options.font : 'djpoida5x5';
    this._text = options && options.text ? options.text : 'Text Layer';

    // TODO: something with this
    this._updateDelay = 1000 / 60;

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
      console.log('TextLayer.updateFrame() - Skipped Frame: already updating frame.');
      return;
    }

    await this.waitForRender();

    this._updatingFrame = true;
    try {
      // TODO: get the font data

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
    const { _font } = this;

    // Can't render twice at the same time. Bail and warn about skipping frames.
    if (this.rendering) {
      console.warn('TextLayer: Skipped render - already rendering pixel data.');
      return;
    }

    this.beginRender();
    try {
      console.log(fonts[_font]);
    } finally {
      this.endRender();
    }
  }

}

module.exports = TextLayer;
