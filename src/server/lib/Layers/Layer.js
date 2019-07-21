const EventEmitter = require('events');

const LAYER_EVENTS = require('../constants/LayerEvents');

/**
 * @class Layer
 */
class Layer extends EventEmitter {

  /**
   * @constructor
   * @param {number} width the width of the new layer
   * @param {number} height the height of the new layer
   * @param {string} [name="new layer"] an optional name for the layer
   */
  constructor(width, height, name = 'new layer') {
    super();

    console.log(`New layer (${name})`);
    this._name = name;
    this._width = width;
    this._height = height;
    this._updateStack = 0;
    this._rendering = false;
    this._invalidated = true;
    this._pixelData = new Uint32Array(width * height);
  }


  /**
   * @type {number}
   */
  get width() { return this._width; }


  /**
   * @type {number}
   */
  get height() { return this._height; }


  /**
   * @type {string}
   */
  get name() { return this._name; }


  /**
   * @description
   * Returns true if the pixel data is in the middle of an update
   *
   * @type {boolean}
   */
  get rendering() { return this._rendering; }


  /**
   * @description
   * Returns true if multiple update operations are being performed on the layer
   */
  get updating() { return this._updateStack > 0; }


  /**
   * @description
   * Begin some form of bulk layer update. This method should be followed buy a
   * corresponding endUpdate().
   */
  beginUpdate() {
    const wasUpdating = this.updating;
    this._updateStack += 1;

    if (!wasUpdating) {
      this.emit(LAYER_EVENTS.UPDATE_STARTED);
    }
  }


  /**
   * @description
   * Begin some form of bulk layer update. This method should be followed buy a
   * corresponding endUpdate().
   */
  endUpdate() {
    const wasUpdating = this.updating;
    this._updateStack = Math.max(this._updateStack - 1, 0);

    if (!this.updating && wasUpdating) {
      this.emit(LAYER_EVENTS.UPDATED_FINISHED);
    }
  }


  /**
   * @description
   * set the color value of a pixel
   *
   * @param {number} x
   * @param {number} y
   * @param {number} color a 32bit color value
   */
  setPixel(x, y, color) {
    this.beginUpdate();
    try {
      this._pixelData[(y * this.width) + x] = color;
    } finally {
      this.endUpdate();
    }
  }


  /**
   * @description
   * Gets the pixel data without conflicting with a frame update
   */
  async getPixelData() {
    return new Promise((resolve) => {
      const waitForRender = () => {
        // Don't resolve the pixel data if the frame is being updated
        if (!this.rendering) {
          resolve(this._pixelData);
        } else {
          setTimeout(() => { waitForRender(); }, 0);
        }
      };

      waitForRender();
    });
  }


  /**
   * @description
   * Called by layers that require frequent updating
   */
  _nextFrame() {
    this.emit(LAYER_EVENTS.UPDATED);
  }


  /**
   * @description
   * calculate the pixel data for this layer
   *
   * @note this function should be overridden in descendant classes
   */
  _render() {
  }

}

module.exports = Layer;
