const EventEmitter = require('events');

const Layer = require('./Layers/Layer');
const argb2int = require('../../lib/helpers/argb2int');
const argbBlend = require('../../lib/helpers/argbBlend');
const stripAlpha = require('../../lib/helpers/stripAlpha');

const BLENDER_EVENTS = require('./constants/BlenderEvents');

/**
 * @class Blender
 * This class is responsible for combining all of the layers together
 *
 * for a good resource on pixel bitwise blending see
 * @see https://50linesofco.de/post/2017-02-13-bits-and-bytes-in-javascript
 */
class Blender extends EventEmitter {
  /**
   * @constructor
   * @param {Kernel} kernel
   */
  constructor(kernel) {
    super();

    this._kernel = kernel;
    this._layers = [];
    this._backgroundLayer = undefined;
    this._pixelData = new Uint32Array(this.numLEDs);
    this._updating = false;

    this._bindEvents();
  }


  /**
   * @description
   * A reference to the kernel
   *
   * @type {Kernel} kernel
   */
  get kernel() { return this._kernel; }


  /**
   * @description
   * The LED matrix layers
   *
   * @type {Layer[]} layers
   */
  get layers() { return this._layers; }


  /**
   * @description
   * The height of the LED matrix
   *
   * @type {number}
   */
  get width() { return this.kernel.config.device.resolution.width; }


  /**
   * @description
   * The width of the LED matrix
   *
   * @type {number}
   */
  get height() { return this.kernel.config.device.resolution.height; }


  /**
   * @description
   * The number of leds. Pretty much just width x height.
   *
   * @type {number}
   */
  get numLEDs() { return this.kernel.config.device.resolution.numLEDs; }


  /**
   * @description
   * The base pixel data of the background layer
   *
   * @type {Layer}
   */
  get backgroundLayer() { return this._backgroundLayer; }


  /**
   * @description
   * Returns true if the pixel data is in the middle of an update
   *
   * @type {boolean}
   */
  get updating() { return this._updating; }


  /**
   * @description
   * Gets the pixel data without conflicting with a frame update
   */
  async getPixelData() {
    return new Promise((resolve) => {
      const waitForNotUpdating = () => {
        // Don't resolve the pixel data if the frame is being updated
        if (!this.updating) {
          resolve(this._pixelData);
        } else {
          setTimeout(() => { waitForNotUpdating(); }, 0);
        }
      };

      waitForNotUpdating();
    });
  }


  /**
   * @description
   * Bind the event listeners this class cares about
   */
  _bindEvents() {
    this.once(BLENDER_EVENTS.INITIALISED, this._handleInitialised.bind(this));
  }


  /**
   * @description
   * Fired when the Layer Blender is initialised
   */
  _handleInitialised() {
    this._render();
    console.log('Layer Blender Initialised.');
  }


  /**
   * @description
   * Blend all of the layers and update the internal pixelData array
   */
  _render() {
    if (this.updating) {
      console.warn('Skipped render: already updating pixel data.');
      return;
    }

    // TODO: log and broadcast the time taken to blend so we can avoid over complicated renders

    // Prevent anyone from accessing the pixel data while we're updating it
    this._updating = true;
    try {
      console.log('Updating Pixel Data');

      // Start with the background layer data
      const newPixelData = new Uint32Array(this.backgroundLayer.pixelData);

      // Iterate over each of the layers and blend their pixel data down into the return pixel data
      this.layers.forEach((layer) => {
        for (let p = 0; p < this.numLEDs; p += 1) {
          newPixelData[p] = argbBlend(newPixelData[p], layer.pixelData[p]);
        }
      });

      // Remove the alpha from the final pixel data (turning a 32bit integer into a 24 bit integer)
      for (let p = 0; p < this.numLEDs; p += 1) {
        newPixelData[p] = stripAlpha(newPixelData[p]);
      }

      this._pixelData = newPixelData;
    } finally {
      this._updating = false;
    }
  }


  /**
   * @description
   * Initialise the Blender
   */
  async initialise() {
    console.log('Blender initialising...');

    // Add a background layer
    this._backgroundLayer = new Layer('background', this.width, this.height, 'Background');

    // @TODO: improve this to use an iterator from the layer
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this._backgroundLayer.setPixel(x, y, argb2int(255, 0, 0, 0));
      }
    }

    const testLayer1 = new Layer('1', this.width, this.height, 'Test Layer 1');

    testLayer1.setPixel(0, 0, argb2int(255, 255, 0, 0));
    testLayer1.setPixel(this.width - 1, 0, argb2int(255, 0, 255, 0));
    testLayer1.setPixel(this.width - 1, this.height - 1, argb2int(255, 0, 0, 255));
    testLayer1.setPixel(0, this.height - 1, argb2int(255, 255, 255, 255));
    testLayer1.setPixel(1, 1, argb2int(128, 255, 0, 0));
    testLayer1.setPixel(this.width - 2, 1, argb2int(128, 0, 255, 0));
    testLayer1.setPixel(this.width - 2, this.height - 2, argb2int(128, 0, 0, 255));
    testLayer1.setPixel(1, this.height - 2, argb2int(128, 255, 255, 255));

    this.layers.push(testLayer1);

    const testLayer2 = new Layer('1', this.width, this.height, 'testLayer2');
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        testLayer2.setPixel(x, y, argb2int(127, 255, 255, 255));
      }
    }

    // this.layers.push(testLayer2);

    // TODO: bind listeners to the layers and update pixel data when they change

    // Let everyone know that the Layer Blender is initialised
    this.emit(BLENDER_EVENTS.INITIALISED);
  }
}

module.exports = Blender;
