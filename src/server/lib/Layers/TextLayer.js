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
    this._fontName = options && options.fontName ? options.fontName : 'djpoida5x5';
    this._text = options && options.text ? options.text : 'Text Layer';

    this.render();
  }


  /**
   * @description
   * Render the pixel data
   */
  render() {
    const { _fontName } = this;
    const font = fonts[_fontName];
    const character = 'G';
    const charCode = character.charCodeAt(0);
    const charData = font.characterData[charCode].d;
    const charWidth = font.characterData[charCode].width || font.width;
    const charHeight = font.height;

    // TODO: FUCK. Convert the whole font from Big Endian to Little Endian

    const pixelData = new Uint32Array(charWidth * charHeight);
    for (let y = 0; y < charHeight; y += 1) {
      const rowVal = charData[y];
      for (let x = 0; x < charWidth; x += 1) {
        pixelData[(y * charWidth) + x] = ((rowVal >> x) & 1) * this._color;
      }
    }

    // Can't render twice at the same time. Bail and warn about skipping frames.
    if (this.rendering) {
      console.warn('TextLayer: Skipped render - already rendering pixel data.');
      return;
    }

    this.beginRender();
    try {
      console.log('=========');
      console.log(JSON.stringify(charData[0]), pixelData);
      console.log('=========');
      this._pixelData = new Uint32Array(this.numLEDs);
      for (let y = 0; y < charHeight; y += 1) {
        for (let x = 0; x < charWidth; x += 1) {
          this._pixelData[(y * this.width) + x] = pixelData[(y * charWidth) + x];
        }
      }

    } finally {
      this.endRender();
    }
  }

}

module.exports = TextLayer;
