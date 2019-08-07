const Layer = require('./Layer');
const argb2int = require('../../../lib/helpers/argb2int');
const renderFontCharacter = require('../../../lib/helpers/renderFontCharacter');

class TextLayer extends Layer {

  /**
   * @constructor
   * @param {Blender} blender a reference to the layer blender
   * @param {
   *  {
   *    color: number,
   *    fontName: string,
   *    speed: number,
   *    text: string,
   *    characterSpacing: number
   *  }
   * } [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(blender, options) {
    super(blender, options);

    this._updatingText = false;

    this._color = options && options.color ? options.color : argb2int(255, 255, 255, 255);
    this._fontName = options && options.fontName ? options.fontName : 'djpoida5x5';
    this._text = options && options.text ? options.text : 'Text Layer';
    this._characterSpacing = options && options.characterSpacing && typeof options.characterSpacing === 'number' ? options.characterSpacing : 1;
    this._speed = options && options.speed && typeof options.speed === 'number' ? options.speed : 10;


    this._textDataWidth = 0;
    this._textDataHeight = 0;
    this._textData = new Uint32Array(0);

    this._xPos = -this.width;
    this._updateDelay = Math.round(1000 / this.speed);
    this._updateFrameInterval = setInterval(this.updateFrame.bind(this), this._updateDelay);

    this.updateText();
    this.updateFrame();
  }


  /**
   * @description
   * Returns true if the cached text data is being updated (not the render)
   *
   * @type {boolean}
   */
  get updatingText() { return this._updatingText; }

  /**
   * @description
   * Returns true if the frame data is being updated (not the render)
   *
   * @type {boolean}
   */
  get updatingFrame() { return this._updatingFrame; }

  /**
   * @type {string}
   */
  get fontName() { return this._fontName; }

  /**
   * @type {number}
   */
  get color() { return this._color; }

  /**
   * @type {number}
   */
  get speed() { return this._speed; }

  /**
   * @type {number}
   */
  get characterSpacing() { return this._characterSpacing; }

  /**
   * @type {string}
   */
  get text() { return this._text; }


  /**
   * @description
   * Render out the text data so that the main render only has to transfer
   * pixel data from the text data to the pixel data
   */
  async updateText() {
    await this.waitForRender();

    if (this.updatingText) {
      console.log('TextLayer.updateText() - Skipped Frame: already updating frame.');
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

      this.render();
    } finally {
      this._updatingText = false;
    }
  }


  /**
   * @description
   * Calculate the next frame data
   */
  async updateFrame() {
    await this.waitForRender();

    if (this.updatingFrame) {
      console.log('TextLayer.updateFrame() - Skipped Frame: already updating frame.');
      return;
    }

    this._updatingFrame = true;
    try {
      this._xPos += 1;
      if (this._xPos > this._textDataWidth) {
        this._xPos = -this.width;
      }

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
      console.warn('TextLayer: Skipped render - already rendering pixel data.');
      return;
    }

    this.beginRender();
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
      this.endRender();
    }
  }

}

module.exports = TextLayer;
