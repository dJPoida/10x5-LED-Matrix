const TextLayer = require('./TextLayer');

class ClockLayer extends TextLayer {

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
  }

  /**
   * @type {string}
   */
  get text() { const now = new Date(); return `${now.getHours()}:${now.getMinutes()}`; }
}

module.exports = ClockLayer;
