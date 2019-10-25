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
  constructor(blender, options = {}) {
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
    this._updateDataInterval = setInterval(this.updateData.bind(this), this._updateDelay);

    this.updateText();
    this.updateData();
  }


  /**
   * @description
   * Returns true if the cached text data is being updated (not the composition or data)
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
  get updatingData() { return this._updatingData; }

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
   * update the text so that the main composition only has to transfer
   * pixel data from the text data to the pixel data
   */
  async updateText() {
    await this.waitForComposition();

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
   * @description
   * Calculate the next layer data
   */
  async updateData() {
    await this.waitForComposition();

    if (this.updatingData) {
      console.warn('TextLayer.updateData() - Skipped: already updating data.');
      return;
    }

    this._updatingData = true;
    try {
      this._xPos += 1;
      if (this._xPos > this._textDataWidth) {
        this._xPos = -this.width;
      }

      // Let the next composition know we have changed the basis of the pixel data and it needs to be updated
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
      this.endComposing();
    }
  }

}

module.exports = TextLayer;
