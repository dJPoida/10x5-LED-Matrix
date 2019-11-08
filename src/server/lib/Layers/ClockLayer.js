const TextLayer = require('./TextLayer');

/**
 * @class ClockLayer
 *
 * @description
 * The clock layer displays the current time. Ultimately it derives from the TextLayer so
 * the options are fundamentally the same as the text layer.
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
 *  `characterSpacing` {number} default = 1
 *  The number of pixels to space each character by
 *
 *  `blend` {boolean} default = true
 *  Whether to blend the line between pixels (aka anti-alias)
 */
class ClockLayer extends TextLayer {

  /**
   * @constructor
   * @param {Scene} scene a reference to the layer scene
   * @param {string} [name = 'New Knight Rider Layer'] a unique name to use when identifying the layer
   * @param {number | Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC} [layerStateUpdateInterval = 500] how often the layer state should be updated
   * @param {
   *  {
   *    color: number,
   *    fontName: string,
   *    speed: number,
   *    characterSpacing: number
   *  }
   * } [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(scene, name = 'New Clock Layer', layerStateUpdateInterval = 500, options = {}) {
    super(scene, name, layerStateUpdateInterval, options);

    // TODO: figure out how to update the curren time
  }


  /**
   * @type {string}
   */
  get text() { const now = new Date(); return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; }
}

module.exports = ClockLayer;
