const { performance } = require('perf_hooks');

const Layer = require('./Layer');

const renderFontCharacter = require('../../../lib/helpers/renderFontCharacter');

/**
 * @class TextLayer
 *
 * @description
 * The text layer displays text in given font. It provides options for scrolling in various ways.
 *
 * Options:
 *  `color` {number} default = 0xFFFFFFFF
 *  The color of the text
 *
 *  `speed` {number} default = 1
 *  The number of characters to scroll by per second
 *
 *  `fontName` {string} default = 'djpoida5x5'
 *  The name of the font to use to display the text
 *
 *  `text` {string} default = 'Text Layer'
 *  The text to display on the layer
 *
 *  `characterSpacing` {number} default = 1
 *  The number of pixels to space each character by
 *
 *  `blend` {boolean} default = true
 *  Whether to blend the line between pixels (aka anti-alias)
 */
class TextLayer extends Layer {

  /**
   * @constructor
   * @param {Scene} scene a reference to the layer scene
   * @param {string} [name = 'New Knight Rider Layer'] a unique name to use when identifying the layer
   * @param {number | Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC} [layerStateUpdateInterval = null] how often the layer state should be updated
   * @param {
   *  {
   *    color: number,
   *    speed: number,
   *    fontName: string,
   *    text: string,
   *    characterSpacing: number
   *  }
   * } [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(scene, name = 'New Text Layer', layerStateUpdateInterval = Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC, options = {}) {
    super(scene, name, layerStateUpdateInterval, {
      color: 0xFFFFFFFF,
      speed: 1,
      fontName: 'djpoida5x5',
      text: 'Text Layer',
      characterSpacing: 1,
      ...options,
    });

    this._updatingText = false;
    this._textDataWidth = 0;
    this._textDataHeight = 0;
    this._textData = new Uint32Array(0);

    this._xPos = -this.width;
    this._tweenStartTime = performance.now();

    this.updateText();
  }


  /**
   * @description
   * Returns true if the cached text data is being updated (not the pixel data or layer state)
   *
   * @type {boolean}
   */
  get updatingText() { return this._updatingText; }

  /**
   * @description
   * Returns true if the layer data is being updated
   *
   * @type {boolean}
   */
  get updatingLayerData() { return this._updatingData; }

  /**
   * @type {string}
   */
  get fontName() { return this.options.fontName; }

  /**
   * @type {number}
   */
  get color() { return this.options.color; }

  /**
   * @type {number}
   */
  get speed() { return this.options.speed; }

  /**
   * @type {number}
   */
  get characterSpacing() { return this.options.characterSpacing; }

  /**
   * @type {string}
   */
  get text() { return this._options.text; }


  /**
   * @description
   * update the text so that the main pixel data update method only has to transfer
   * pixel data from the text data to the output pixel data
   */
  async updateText() {
    await this.waitForUpdatePixelData();

    if (this.updatingText) {
      console.log('TextLayer.updateText() - Skipped: already updating text.');
      return;
    }

    this._updatingText = true;
    try {
      const {
        fontName, text, color, characterSpacing,
      } = this;
      let textDataWidth = 0;
      let textDataHeight = 0;

      // Render each of the text characters into an array
      const charData = [];
      for (let i = 0; i < text.length; i += 1) {
        const char = renderFontCharacter(fontName, text.charAt(i), color);
        textDataWidth += ((i > 0) ? characterSpacing : 0) + char.width;
        textDataHeight = char.height;
        charData.push(char);
      }

      const newTextData = new Uint32Array(textDataWidth * textDataHeight);
      let xOffset = 0;
      charData.forEach((char) => {
        for (let y = 0; y < char.height; y += 1) {
          for (let x = 0; x < char.width; x += 1) {
            newTextData[(y * textDataWidth) + xOffset + x] = char.pixelData[(y * char.width) + x];
          }
        }
        xOffset += char.width + characterSpacing;
      });

      this._textDataWidth = textDataWidth;
      this._textDataHeight = textDataHeight;
      this._textData = newTextData;

      this.invalidate();
    } finally {
      this._updatingText = false;
    }
  }


  /**
   * @inheritdoc
   */
  async updateLayerState() {
    if (!super.updateLayerState()) return false;

    this.beginUpdatingLayerState();
    let invalidated = false;
    try {
      const oldXpos = this._xPos;

      // TODO: the `5` here is supposed to be the default number of pixels in the font
      const invalidationTime = (1000 / 5 / this.speed);

      let currentTweenTimeElapsed = performance.now() - this._tweenStartTime;
      if (currentTweenTimeElapsed > invalidationTime) {
        // Reset the duration
        this._tweenStartTime = performance.now() - (currentTweenTimeElapsed - invalidationTime);
        currentTweenTimeElapsed = performance.now() - this._tweenStartTime;

        this._xPos += 1;
        if (this._xPos > this._textDataWidth) {
          this._xPos = -this.width;
        }
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
      const {
        _textData, _textDataWidth, _textDataHeight, _xPos,
      } = this;
      this._pixelData = new Uint32Array(this.numLEDs);
      for (let y = 0; y < _textDataHeight; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          const xOffset = x + _xPos;
          if ((xOffset >= 0) && (xOffset < _textDataWidth)) {
            this._pixelData[(y * this.width) + x] = _textData[(y * _textDataWidth) + xOffset];
          }
        }
      }
    } finally {
      this.endUpdatingPixelData();
    }

    return true;
  }

}

module.exports = TextLayer;
