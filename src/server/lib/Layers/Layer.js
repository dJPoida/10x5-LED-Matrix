const EventEmitter = require('events');

const Scene = require('../Scene');

const effectTypeClassMap = require('../../../lib/helpers/effectTypeClassMap');

const LAYER_EVENTS = require('../constants/LayerEvents');

/**
 * @class Layer
 * @abstract
 */
class Layer extends EventEmitter {

  /**
   * @constructor
   * @param {Scene} scene a reference to the layer scene
   * @param {string} [name = 'New Layer'] a unique name to use when identifying the layer
   * @param {number | Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC} [layerStateUpdateInterval = null] how often the layer state should be updated
   * @param {{}} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(scene, name = 'New Layer', layerStateUpdateInterval = null, options = {}) {
    super();

    if (!(scene instanceof Scene.constructor)) {
      throw new TypeError('New Layer: `scene` parameter must be a reference to a Scene class that owns the layer.');
    }

    this._scene = scene;
    this._name = name || 'New Layer';
    this._layerStateUpdateInterval = layerStateUpdateInterval || null;

    this._options = {
      ...(options || {}),
    };

    this._effects = [];

    this._invalidated = true;
    this._updatingPixelDataStack = 0;
    this._updatingLayerStateStack = 0;
    this._rendering = false;
    this._nextPixelData = new Uint32Array(this.width * this.height);
    this._pixelData = new Uint32Array(this.width * this.height);

    if (typeof this.layerStateUpdateInterval === 'number') {
      setInterval(this.updateLayerState.bind(this), this.layerStateUpdateInterval);
    }
  }


  /**
   * @type {Scene}
   */
  get scene() { return this._scene; }


  /**
   * @type {{}}
   */
  get options() { return this._options; }

  set options(value) { this._options = value; this.invalidate(); }


  /**
   * @type {number}
   */
  get width() { return this.scene.width; }


  /**
   * @type {number}
   */
  get height() { return this.scene.height; }


  /**
   * @type {number}
   */
  get numLEDs() { return this.scene.numLEDs; }


  /**
   * @description
   * The duration of each frame
   *
   * @type {number}
   */
  get frameDuration() { return this.scene.frameDuration; }


  /**
   * @description
   * The configured, desired FPS of the device
   *
   * @type {number}
   */
  get fps() { return this.scene.fps; }


  /**
   * @description
   * Gets the current frame (fractional) since the scene started
   *
   * @type {number}
   */
  get currentFrame() { return this.scene.currentFrame; }


  /**
   * @description
   * Gets the current time code since the scene started
   *
   * @type {{
    *  days: number,
    *  hours: number,
    *  minutes: number,
    *  seconds: number,
    *  frames: number,
    * }}
   */
  get currentTimeCode() { return this.scene.currentTimeCode; }


  /**
   * @type {string}
   */
  get name() { return this._name; }


  /**
   * @type {number | Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC}
   */
  get layerStateUpdateInterval() { return this._layerStateUpdateInterval; }


  /**
   * @description
   * Returns true if something has affected the layer and it needs to be re-rendered
   */
  get invalidated() { return this._invalidated; }


  /**
   * @description
   * Returns true if multiple update pixel data operations are being performed on the layer
   */
  get updatingPixelData() { return this._updatingPixelDataStack > 0; }


  /**
   * @description
   * Returns true if multiple update layer state operations are being performed on the layer
   */
  get updatingLayerState() { return this._updatingLayerStateStack > 0; }


  /**
   * @description
   * Returns true if currently rendering the layer
   */
  get rendering() { return this._rendering; }


  /**
   * @description
   * Add an effect to this layer
   *
   * @param {EFFECT_TYPE} effectType
   * @param {object} options
   */
  addEffect(effectType, options) {
    const EffectClass = effectTypeClassMap(effectType);
    this._effects.push(new EffectClass(this, options));
  }


  /**
   * @description
   * Begin some form of bulk layer pixel data update. This method should be followed buy a
   * corresponding endUpdatingPixelData().
   */
  beginUpdatingPixelData() {
    const wasUpdatingPixelData = this.updatingPixelData;
    this._updatingPixelDataStack += 1;

    if (!wasUpdatingPixelData) {
      this.emit(LAYER_EVENTS.PIXEL_DATA_UPDATE_STARTED);
    }
  }


  /**
   * @description
   * End a bulk layer pixel data update. This method follows a corresponding beginUpdatingPixelData().
   */
  endUpdatingPixelData() {
    const wasUpdatingPixelData = this.updatingPixelData;
    this._updatingPixelDataStack = Math.max(this._updatingPixelDataStack - 1, 0);

    if (!this.updatingPixelData && wasUpdatingPixelData) {
      this.emit(LAYER_EVENTS.PIXEL_DATA_UPDATE_FINISHED);

      // Validate the pixel data
      this._invalidated = false;
    }
  }


  /**
   * @description
   * Begin updating the Layer State. This method should be followed by a corresponding
   * endUpdatingLayerState().
   */
  beginUpdatingLayerState() {
    const wasUpdatingLayerState = this.updatingLayerState;
    this._updatingLayerStateStack += 1;

    if (!wasUpdatingLayerState) {
      this.emit(LAYER_EVENTS.LAYER_STATE_UPDATE_STARTED);
    }
  }


  /**
   * @description
   * End a bulk layer state update. This method follows a corresponding beginUpdatingLayerState().
   *
   * @param {boolean} [invalidate=false] whether the layer state update invalidated the layer
   */
  endUpdatingLayerState(invalidate = false) {
    const wasUpdatingLayerState = this.updatingLayerState;
    this._updatingLayerStateStack = Math.max(this._updatingLayerStateStack - 1, 0);

    if (!this.updatingLayerState && wasUpdatingLayerState) {
      this.emit(LAYER_EVENTS.LAYER_STATE_UPDATE_FINISHED);
    }

    // Invalidate the pixel data
    if (invalidate) {
      this.invalidate();
    }
  }


  /**
   * @description
   * Iterate over the layer's effects and render them accordingly
   *
   * @param {Uint32Array} pixelData the pixel data to use as the source for the effects
   *
   * @returns {Uint32Array} the affected pixel data
   */
  renderEffects(pixelData) {
    // TODO: effects should not interfere with the source pixel data
    if (!this._effects.length) return pixelData;

    let affectedPixelData = new Uint32Array(pixelData);
    this._effects.forEach((effect) => {
      affectedPixelData = effect.render(affectedPixelData);
    });

    return affectedPixelData;
  }


  /**
   * @description
   * Use this function to wait for any outstanding updatePixelData functions before
   * performing an action that may interfere with a updatePixelData
   */
  async waitForUpdatePixelData() {
    return new Promise((resolve) => {
      const wait = () => {
        if (!this.updatingPixelData) {
          resolve();
        } else {
          setTimeout(wait, 0);
        }
      };

      wait();
    });
  }


  /**
   * @description
   * Use this function to wait for any outstanding updateLayerState functions before
   * performing an action that may interfere with a updateLayerState
   */
  async waitForUpdateLayerState() {
    return new Promise((resolve) => {
      const wait = () => {
        if (!this.updatingLayerState) {
          resolve();
        } else {
          setTimeout(wait, 0);
        }
      };

      wait();
    });
  }


  /**
   * @description
   * Flag that the pixel data is no longer valid and should be re-updated
   */
  invalidate() {
    this._invalidated = true;
    this.emit(LAYER_EVENTS.INVALIDATED);
  }


  /**
   * @description
   * Update the layer state
   *
   * @returns {boolean} true if the layer state was / needed to be updated
   */
  async updateLayerState() {
    await this.waitForUpdatePixelData();

    // Can't updatePixelData twice at the same time. Bail and warn about skipping.
    if (this.updatingLayerState) {
      console.warn(`${this.name}: Skipped updateLayerState() - already updating layer state.`);
      return false;
    }

    // Implement this pattern in descendant Layer classes to update the layer state
    // this.beginUpdatingLayerState();
    // try {
    // } finally {
    //   this.endUpdatingLayerState();
    // }

    return true;
  }


  /**
   * @description
   * Update the pixel data
   *
   * @returns {boolean} true if the pixel data was / needed to be updated
   */
  updatePixelData() {
    // Can't updatePixelData twice at the same time. Bail and warn about skipping.
    if (this.updatingPixelData) {
      console.warn(`${this.name}: Skipped updatePixelData() - already updating pixel data.`);
      return false;
    }

    if (!this.invalidated) return false;

    // Implement this pattern in descendant Layer classes to construct the _pixelData
    // this.beginUpdatingPixelData();
    // try {
    // } finally {
    //   this.endUpdatingPixelData();
    // }

    return true;
  }


  /**
   * @description
   * Called every by the scene to render the layer (if required) and apply the effects to
   * the pixel data before returning the pixel data for rendering to the output buffer
   *
   * @returns {Uint32Array}
   */
  async render() {
    // Can't render twice at the same time. Bail and warn about skipping frames.
    if (this.rendering) {
      console.warn(`${this.name}: Skipped render(): already rendering.`);
      return false;
    }

    this._rendering = true;

    let renderedPixelData;
    try {
      // Is the update layer state bound to the frame render?
      if (this.layerStateUpdateInterval === Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC) {
        await this.updateLayerState();
      }

      // Does the layer need a pixel data update?
      if (this.invalidated) {
        await this.updatePixelData();
      }

      // Apply the effects on every render based on the last updated _pixelData
      renderedPixelData = this.renderEffects(this._pixelData);
    } finally {
      this._rendering = false;
    }

    return renderedPixelData || this._pixelData;
  }
}

Layer.LAYER_STATE_UPDATE_INTERVAL_FRAME_SYNC = Symbol('frameSync');

module.exports = Layer;
