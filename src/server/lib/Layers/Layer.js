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
    this._renderStack = 0;
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
   * Returns true if multiple render operations are being performed on the layer
   */
  get rendering() { return this._renderStack > 0; }


  /**
   * @description
   * Begin some form of bulk layer render. This method should be followed buy a
   * corresponding endRender().
   */
  beginRender() {
    const wasRendering = this.rendering;
    this._renderStack += 1;

    if (!wasRendering) {
      this.emit(LAYER_EVENTS.RENDER_STARTED);
    }
  }


  /**
   * @description
   * End a bulk layer render. This method should be followed buy a
   * corresponding endRender().
   */
  endRender() {
    const wasRendering = this.rendering;
    this._renderStack = Math.max(this._renderStack - 1, 0);

    if (!this.rendering && wasRendering) {
      this.emit(LAYER_EVENTS.RENDER_FINISHED);

      // Notify all listeners of invalidation (if invalidated)
      this.invalidate();
    }
  }


  /**
   * @description
   * Use this function to wait for any outstanding render functions before
   * performing an action that may interfere with a render
   */
  async waitForRender() {
    return new Promise((resolve) => {
      const waitForRender = () => {
        if (!this.rendering) {
          resolve();
        } else {
          setTimeout(this.waitForRender, 0);
        }
      };

      waitForRender();
    });
  }


  /**
   * @description
   * Flag that the blended pixel data is no longer valid and should be re-rendered
   */
  invalidate() {
    this._invalidated = true;
    this.emit(LAYER_EVENTS.INVALIDATED);
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
    this.beginRender();
    try {
      this._pixelData[(y * this.width) + x] = color;
    } finally {
      this.endRender();
    }
  }


  /**
   * @description
   * Gets the pixel data without conflicting with a frame update
   */
  async getPixelData() {
    return new Promise((resolve) => {
      const waitForUpdate = () => {
        // Don't resolve the pixel data if the frame is being updated
        if (!this.updating) {
          resolve(this._pixelData);
        } else {
          setTimeout(() => { waitForUpdate(); }, 0);
        }
      };

      waitForUpdate();
    });
  }
}

module.exports = Layer;
