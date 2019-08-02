const EventEmitter = require('events');
const readline = require('readline');

const argb2int = require('../../lib/helpers/argb2int');
const argbBlend = require('../../lib/helpers/argbBlend');
const stripAlpha = require('../../lib/helpers/stripAlpha');

const SolidColorLayer = require('./Layers/SolidColorLayer');
const TestPatternLayer = require('./Layers/TestPatternLayer');
const KnightRiderLayer = require('./Layers/KnightRiderLayer');
const GhostLayer = require('./Layers/GhostLayer');
const PulseLayer = require('./Layers/PulseLayer');
const TextLayer = require('./Layers/TextLayer');

const DecayEffect = require('./Effects/DecayEffect');

const BLENDER_EVENTS = require('./constants/BlenderEvents');
const LAYER_EVENTS = require('./constants/LayerEvents');


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
    this._rendering = false;
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
   *
   * @returns {Uint32Array}
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
    this._backgroundLayer = new SolidColorLayer(this, { color: argb2int(255, 0, 0, 0) });

    // TODO: remove this test layer once the loading from config is available
    this.addLayer(new PulseLayer(this, { duration: 5000, color: argb2int(255, 0, 0, 255) }));

    // TODO: remove this test pattern layer once the loading from the config is available
    // this.addLayer(new TestPatternLayer(this));

    // TODO: remove this test layer once the loading from config is available
    // const redKnightRiderLayer = this.addLayer(new KnightRiderLayer(this, { sweepDuration: 2000 }));
    // redKnightRiderLayer.addEffect(new DecayEffect(redKnightRiderLayer));

    // TODO: remove this test layer once the loading from config is available
    // this.addLayer(new GhostLayer(this, { color: argb2int(255, 255, 255, 0) }));

    // TODO: remove this test layer once the loading from config is available
    // const greenKnightRiderLayer = this.addLayer(new KnightRiderLayer(this, { sweepDuration: 1500, color: argb2int(255, 0, 255, 0) }));
    // greenKnightRiderLayer.addEffect(new DecayEffect(greenKnightRiderLayer));

    this.addLayer(new TextLayer(this));

    // Let everyone know that the Layer Blender is initialised
    this.emit(BLENDER_EVENTS.INITIALISED);
  }


  /**
   * @description
   * Blend all of the layers and update the internal pixelData array
   *
   * @returns {boolean} true if the pixel data was changed
   */
  async render() {
    // If nothing has changed then don't bother updating the pixel data
    if (!this._invalidated) return false;

    // Can't render twice at the same time. Bail and warn about skipping frames.
    if (this.rendering) {
      console.warn('Skipped render: already rendering pixel data.');
      return false;
    }

    // TODO: log and broadcast the time taken to blend so we can avoid over complicated renders

    // Prevent anyone from accessing the pixel data while we're updating it
    this._rendering = true;
    try {
      // TODO: This is purely for debug purposes. Prolly need to take it out at some point
      this._uniqueBlendId += 1;
      process.stdout.write(`RENDERED UNIQUE FRAME: ${this._uniqueBlendId}`);
      readline.cursorTo(process.stdout, 0);

      // Start with the background layer data
      const newPixelData = new Uint32Array(await this.backgroundLayer.getPixelData());

      // because layer.getPixelData() is async, we have to get them all using await / promises
      const allLayersPixelData = await Promise.all(this.layers.map(layer => layer.getPixelData()));

      // Iterate over each of the layers and blend their pixel data down into the return pixel data
      allLayersPixelData.forEach((layerPixelData) => {
        for (let p = 0; p < this.numLEDs; p += 1) {
          newPixelData[p] = argbBlend(newPixelData[p], layerPixelData[p]);
        }
      });

      // Remove the alpha from the final pixel data (turning a 32bit integer into a 24 bit integer)
      for (let p = 0; p < this.numLEDs; p += 1) {
        newPixelData[p] = stripAlpha(newPixelData[p]);
      }

      this._pixelData = Object.values(newPixelData);

    } catch (ex) {
      console.error('Blender.render() error: ', ex);
      return false;
    } finally {
      this._invalidated = false;
      this._rendering = false;
    }
    return true;
  }
}

module.exports = Blender;
