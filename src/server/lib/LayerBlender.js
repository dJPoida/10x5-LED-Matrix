const EventEmitter = require('events');

const Layer = require('./Layers/Layer');
const argb2int = require('../../lib/helpers/argb2int');

const LAYER_BLENDER_EVENTS = require('./constants/LayerBlenderEvents');

/**
 * @class LayerBlender
 * This class is responsible for combining all of the layers together
 *
 * for a good resource on pixel bitwise blending see
 * @see https://50linesofco.de/post/2017-02-13-bits-and-bytes-in-javascript
 */
class LayerBlender extends EventEmitter {
  /**
   * @constructor
   * @param {Kernel} kernel
   */
  constructor(kernel) {
    super();

    this._kernel = kernel;
    this._layers = [];
    this._pixelData = new Uint32Array(this.numLEDs);

    this.bindEvents();
  }


  /**
   * @type {Kernel} kernel
   */
  get kernel() { return this._kernel; }


  /**
   * @type {Layer[]} layers
   */
  get layers() { return this._layers; }


  /**
   * @type {number}
   */
  get width() { return this.kernel.config.device.resolution.width; }


  /**
   * @type {number}
   */
  get height() { return this.kernel.config.device.resolution.height; }


  /**
   * @type {number}
   */
  get numLEDs() { return this.kernel.config.device.resolution.numLEDs; }


  /**
   * @type {Uint32Array}
   */
  get pixelData() { return this._pixelData; }


  /**
   * @description
   * Bind the event listeners this class cares about
   */
  bindEvents() {
    this.once(LAYER_BLENDER_EVENTS.INITIALISED, this.handleInitialised.bind(this));
  }


  /**
   * @description
   * Initialise the Layer Blender
   */
  async initialise() {
    console.log('Layer Blender initialising...');

    // Add a background layer
    const background = new Layer(this.width, this.height);

    // @TODO: remove these debug lines which place 4x pixels in the top left
    background.setPixel(0, 0, argb2int(255, 255, 0, 0));
    background.setPixel(this.width - 1, 0, argb2int(255, 0, 255, 0));
    background.setPixel(this.width - 1, this.height - 1, argb2int(255, 0, 0, 255));
    background.setPixel(0, this.height - 1, argb2int(255, 255, 255, 255));

    this.layers.push(background);

    // TODO: bind listeners to the layers and update pixel data when they change

    // Let everyone know that the Layer Blender is initialised
    this.emit(LAYER_BLENDER_EVENTS.INITIALISED);
  }


  /**
   * @description
   * Fired when the Layer Blender is initialised
   */
  handleInitialised() {
    this._updatePixelData();
    console.log('Layer Blender Initialised.');
  }


  /**
   * @description
   * Blend all of the layers and update the internal pixelData array
   *
   * @returns {Uint32Array}
   */
  _updatePixelData() {
    const newPixelData = new Uint32Array(this.numLEDs);

    // TODO: this could be made more efficient by only returning the background layer if there is only a single layer in the layers array

    // Iterate over each of the layers and blend their pixel data down into the return pixel data
    this.layers.forEach((layer) => {
      for (let p = 0; p < this.numLEDs; p += 1) {
        newPixelData[p] = layer.pixelData[p];
        // TODO: blending is not working yet
        // newPixelData[p] = newPixelData[p] & layer.pixelData[p];
      }
    });

    // TODO: maybe need some kind of mutex to prevent this from being written at an inopportune time
    this._pixelData = newPixelData;
  }
}

module.exports = LayerBlender;
