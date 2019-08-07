const fonts = require('../pixelFonts/fonts');


/**
 * @description
 * Render out and cache font data to improve
 *
 * @param {string} fontName the name of the font to render
 * @param {string} character the character to render
 * @param {number} color a 32bit ARGB encoded color
 *
 * @returns {{
 *    pixelData: Uint32Array,
 *    width: number,
 *    height: number
 * }}
 */
const renderFontCharacter = (fontName, character, color) => {
  const font = fonts[fontName];

  if (!font) throw new Error('renderFontCharacter: invalid fontName');

  const charCode = character.charCodeAt(0);
  let characterData = font.characterData[charCode];

  // If the character is not implemented by the font then the default unknown char square is used
  if (!characterData) {
    console.warn(`renderFontCharacter: unhandled character: ${character}`);
    const { unhandledCharacter } = font;
    characterData = unhandledCharacter;
  }

  const charData = characterData.d;
  const charWidth = characterData.width || font.width;
  const charHeight = font.height;
  const pixelData = new Uint32Array(charWidth * charHeight);
  for (let y = 0; y < charHeight; y += 1) {
    const rowVal = charData[y];
    for (let x = 0; x < charWidth; x += 1) {
      pixelData[(y * charWidth) + x] = ((rowVal >> x) & 1) * color;
    }
  }

  return {
    pixelData,
    character,
    width: charWidth,
    height: charHeight,
  };
};

module.exports = renderFontCharacter;
