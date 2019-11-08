const EventEmitter = require('events');
const { performance } = require('perf_hooks');

const argbBlendLayer = require('../../lib/helpers/argbBlendLayer');
const stripAlpha = require('../../lib/helpers/stripAlpha');
const msToTimeCode = require('../../lib/helpers/msToTimeCode');

const layerTypeClassMap = require('../../lib/helpers/layerTypeClassMap');

const Layer = require('./Layers/Layer');

const SCENE_EVENTS = require('./constants/SceneEvents');


/**
 * @class Scene
 * This class is responsible for combining all of the layers together
 *
 * for a good resource on pixel bitwise blending see
 * @see https://50linesofco.de/post/2017-02-13-bits-and-bytes-in-javascript
 */
class Scene extends EventEmitter {

  /**
   * @constructor
   * @param {Kernel} kernel
   */
  constructor(kernel) {
    super();

    this._kernel = kernel;
    this._layers = [];
    this._pixelData = new Uint32Array(this.numLEDs);
    this._rendering = false;
    this._nextLayerId = 0;

    this._sceneLoadedOffset = performance.now();

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
   * The duration of each frame
   *
   * @type {number}
   */
  get frameDuration() { return this.kernel.frameDuration; }


  /**
   * @description
   * The configured, desired FPS of the device
   *
   * @type {number}
   */
  get fps() { return this.kernel.config.device.fps; }


  /**
   * @description
   * Gets the current frame (fractional) since the scene started
   *
   * @returns {number}
   */
  get currentFrame() {
    return Math.floor((performance.now() - this._sceneLoadedOffset) / this.frameDuration);
  }


  /**
   * @description
   * Gets the current frame (fractional) since the scene started
   *
   * @returns {{
   *  days: number,
   *  hours: number,
   *  minutes: number,
   *  seconds: number,
   *  frames: number,
   * }}
   */
  get currentTimeCode() {
    return msToTimeCode((performance.now() - this._sceneLoadedOffset), this.kernel.config.device.fps);
  }


  /**
   * @description
   * Returns true if the layer manager is in the middle of a render
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
   * @param {LayerType} layerType
   * @param {string} layerName
   * @param {number | Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC} layerStateUpdateInterval
   * @param {{}} options
   *
   * @returns {Layer}
   */
  addLayer(layerType, layerName, layerStateUpdateInterval, options) {
    // Find the appropriate class based on the provided layer type
    const LayerClass = layerTypeClassMap(layerType);

    // instantiate the layer and pass in teh options
    const layer = new LayerClass(this, layerName, layerStateUpdateInterval, options);

    // push the layer onto the stack
    this.layers.push(layer);

    return layer;
  }


  /**
   * @description
   * Bind the event listeners this class cares about
   */
  _bindEvents() {
    this.once(SCENE_EVENTS.INITIALISED, this._handleInitialised.bind(this));
  }


  /**
   * @description
   * Fired when the Layer Scene is initialised
   */
  _handleInitialised() {
    console.log('Layer Scene Initialised.');
  }


  /**
   * @description
   * Initialise the Scene
   *
   * @param {{
   *  id: string,
   *  name: string,
   *  layers: {
   *    id: string,
   *    name: string,
   *    type: LAYER_TYPE,
   *  }[]
   * }} scene
   */
  async initialise(scene = {}) {
    console.log('Scene initialising...');

    // Iterate over the layers in the scene
    if (scene && scene.layers) {
      scene.layers.forEach((layer) => {
        // Create and add the new layer
        const newLayer = this.addLayer(layer.type, layer.name, layer.layerStateUpdateInterval, layer.options);

        // Apply any effects
        if (Array.isArray(layer.effects)) {
          layer.effects.forEach((effect) => {
            newLayer.addEffect(effect.type, effect.options);
          });
        }
      });
    }

    // Let everyone know that the Layer Scene is initialised
    this.emit(SCENE_EVENTS.INITIALISED);
  }


  /**
   * @description
   * Render all of the layers and update the internal pixelData array
   *
   * @returns {{
   *  pixelData: Uint32Array
   *  layerRenderDurations: {}
   *  error: string | null,
   * }} the rendered pixel data
   */
  async render() {
    if (this.rendering) {
      return {
        pixelData: null,
        layerRenderDurations: {},
        error: 'Scene.render() - rendering already in progress. Skipped.',
      };
    }

    // Prevent anyone from accessing the pixel data while we're updating it
    this._rendering = true;
    try {
      // Start with a fully transparent array with the total number of LEDs in the matrix
      let newPixelData = (new Uint32Array(this.numLEDs)).fill(0xFF000000);

      // because layer.getPixelData() is async, we have to get them all using await / promises
      const allLayersPixelData = await Promise.all(this.layers.map(layer => layer.render()));

      // Iterate over each of the layers and blend it with the return pixel data
      allLayersPixelData.forEach((layerPixelData) => {
        newPixelData = argbBlendLayer(newPixelData, layerPixelData);
      });

      // Remove the alpha from the final pixel data (turning a 32bit integer into a 24 bit integer)
      for (let p = 0; p < this.numLEDs; p += 1) {
        newPixelData[p] = stripAlpha(newPixelData[p]);
      }

      this._pixelData = Object.values(newPixelData);

    } catch (ex) {
      console.error('Scene.render() error: ', ex);

      return {
        pixelData: null,
        layerRenderDurations: {},
        error: `Scene.render() - error: ${ex}`,
      };

    } finally {
      this._rendering = false;
    }

    return {
      pixelData: this._pixelData,
      layerRenderDurations: {}, // TODO:
      error: null,
    };
  }
}

module.exports = Scene;
