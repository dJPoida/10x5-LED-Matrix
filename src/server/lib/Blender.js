const EventEmitter = require('events');
const readline = require('readline');

const argb2int = require('../../lib/helpers/argb2int');
const argbBlend = require('../../lib/helpers/argbBlend');
const stripAlpha = require('../../lib/helpers/stripAlpha');

const Layer = require('./Layers/Layer');
const SolidColorLayer = require('./Layers/SolidColorLayer');
const TestPatternLayer = require('./Layers/TestPatternLayer');
const KnightRiderLayer = require('./Layers/KnightRiderLayer');

const BLENDER_EVENTS = require('./constants/BlenderEvents');
const LAYER_EVENTS = require('./constants/LayerEvents');
const LAYER_TYPE = require('./constants/LayerType');

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
    this._invalidated = true;
    this._nextLayerId = 0;
    this._uniqueBlendId = 0;

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
   * @type {boolean}
   */
  get invalidated() { return this._invalidated; }


  /**
   * @description
   * Returns true if the layer blender is in the middle of a render
   *
   * @type {boolean}
   */
  get rendering() { return this._rendering; }


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
   * Notify each of the layers to update their frame data
   */
  async renderLayers() {
    // TODO: do we need an updating layers flag here too?

    this.layers.forEach(async (layer) => { await layer.render(); });
  }


  /**
   * @description
   * Add a layer
   *
   * @param {Layer} layer
   */
  addLayer(layer) {
    // Invalidate the blender whenever a layer is updated
    layer.on(LAYER_EVENTS.INVALIDATED, this.invalidate.bind(this));

    this.layers.push(layer);

    this.invalidate();

    return layer;
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
    console.log('Layer Blender Initialised.');
  }


  /**
   * @description
   * Flag that the blended pixel data is no longer valid and should be re-rendered
   */
  invalidate() {
    this._invalidated = true;
  }


  /**
   * @description
   * Initialise the Blender
   */
  async initialise() {
    console.log('Blender initialising...');

    // Add a background layer (this is a special layer different from most other layers and not part of the layer stack)
    this._backgroundLayer = new SolidColorLayer(this.width, this.height, 'Background', { color: argb2int(255, 0, 0, 0) });

    // TODO: remove this test pattern layer once the loading from the config is available
    this.addLayer(new TestPatternLayer(this.width, this.height));

    // Add a knight rider layer
    this.addLayer(new KnightRiderLayer(this.width, this.height));

    // Let everyone know that the Layer Blender is initialised
    this.emit(BLENDER_EVENTS.INITIALISED);
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
      // If nothing has changed then don't bother updating the pixel data
      if (!this._invalidated) return;

      this._uniqueBlendId += 1;
      process.stdout.write(`RENDERED UNIQUE FRAME: ${this._uniqueBlendId}`);
      readline.cursorTo(process.stdout, 0);

      // Start with the background layer data
      const newPixelData = new Uint32Array(this.backgroundLayer.getPixelData());

      // Iterate over each of the layers and blend their pixel data down into the return pixel data
      this.layers.forEach((layer) => {
        const layerPixelData = layer.getPixelData();

        for (let p = 0; p < this.numLEDs; p += 1) {
          newPixelData[p] = argbBlend(newPixelData[p], layerPixelData[p]);
        }
      });

      // Remove the alpha from the final pixel data (turning a 32bit integer into a 24 bit integer)
      for (let p = 0; p < this.numLEDs; p += 1) {
        newPixelData[p] = stripAlpha(newPixelData[p]);
      }

      this._pixelData = newPixelData;
    } finally {
      this._invalidated = false;
      this._updating = false;
    }
  }
}

module.exports = Blender;
