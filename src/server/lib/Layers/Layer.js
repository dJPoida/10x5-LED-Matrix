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
   * @param {object} [options={}] an optional set of options specific to the type of layer being instantiated
   */
  constructor(scene, options) {
    super();

    if (!(scene instanceof Scene.constructor)) {
      throw new TypeError('New Layer: `scene` parameter must be a reference to a Scene class that owns the layer.');
    }

    this._scene = scene;

    options = options || {};
    this._effects = [];

    this._name = options.name || 'New Layer';

    this._composeStack = 0;
    this._invalidated = true;
    this._renderingFrame = false;
    this._nextPixelData = new Uint32Array(this.width * this.height);
    this._pixelData = new Uint32Array(this.width * this.height);

    console.log(`New layer (${this.name})`, { options });
  }


  /**
   * @type {Scene}
   */
  get scene() { return this._scene; }


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
   * @type {string}
   */
  get name() { return this._name; }


  /**
   * @description
   * Returns true if something has affected the layer and it needs to be re-composed
   */
  get invalidated() { return this._invalidated; }


  /**
   * @description
   * Returns true if multiple composition operations are being performed on the layer
   */
  get composing() { return this._composeStack > 0; }


  /**
   * @description
   * Returns true if the current frame is being rendered
   */
  get renderingFrame() { return this._renderingFrame; }


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
   * Begin some form of bulk layer composition. This method should be followed buy a
   * corresponding endComposing().
   */
  beginComposing() {
    const wasComposing = this.composing;
    this._composeStack += 1;

    if (!wasComposing) {
      this.emit(LAYER_EVENTS.COMPOSE_STARTED);
    }
  }


  /**
   * @description
   * End a bulk layer composition. This method follows a corresponding beginComposing().
   */
  endComposing() {
    const wasComposing = this.composing;
    this._composeStack = Math.max(this._composeStack - 1, 0);

    if (!this.composing && wasComposing) {
      this.emit(LAYER_EVENTS.COMPOSITION_FINISHED);

      // Notify all listeners of invalidation (if invalidated)
      this.invalidate();
    }
  }


  /**
   * @description
   * Iterate over the layer's effects and apply them accordingly
   *
   * @param {Uint32Array} pixelData the pixel data to use as the source for the effects
   *
   * @returns {Uint32Array} the affected pixel data
   */
  applyEffects(pixelData) {
    // TODO: effects should not interfere with the source pixel data
    if (!this._effects.length) return pixelData;

    let affectedPixelData = new Uint32Array(pixelData);
    this._effects.forEach((effect) => {
      affectedPixelData = effect.apply(affectedPixelData);
    });

    return affectedPixelData;
  }


  /**
   * @description
   * Use this function to wait for any outstanding compose functions before
   * performing an action that may interfere with a compose
   */
  async waitForComposition() {
    return new Promise((resolve) => {
      const waitForComposition = () => {
        if (!this.composing) {
          resolve();
        } else {
          setTimeout(this.waitForComposition, 0);
        }
      };

      waitForComposition();
    });
  }


  /**
   * @description
   * Flag that the composed pixel data is no longer valid and should be re-composed
   */
  invalidate() {
    this._invalidated = true;
    this.emit(LAYER_EVENTS.INVALIDATED);
  }


  /**
   * @description
   * Compose the pixel data
   */
  compose() {
    // Can't compose twice at the same time. Bail and warn about skipping.
    if (this.composing) {
      console.warn(`${this.name}: Skipped compose() - already composing pixel data.`);
      return;
    }

    if (!this.invalidated) return;

    this.beginComposing();
    try {
      // Implement this method in descendant Layer classes to construct the _pixelData
    } finally {
      this.endComposing();
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
    this.beginComposing();
    try {
      this._pixelData[(y * this.width) + x] = color;
    } finally {
      this.endComposing();
    }
  }


  /**
   * @description
   * Called every frame by the scene to apply the effects to the pixel data and return
   * the pixel data for rendering to the output buffer
   *
   * @returns {Uint32Array}
   */
  async renderFrame() {
    // Can't render twice at the same time. Bail and warn about skipping frames.
    if (this.renderingFrame) {
      console.warn(`${this.name}: Skipped renderFrame(): already rendering frame.`);
      return false;
    }

    this._renderingFrame = true;

    let renderedPixelData;
    try {
      // Does the layer need composition?
      if (this.invalidated) {
        await this.compose();
      }

      // Apply the effects on every render based on the last updated _pixelData
      renderedPixelData = this.applyEffects(this._pixelData);
    } finally {
      this._renderingFrame = false;
    }

    return renderedPixelData || this._pixelData;
  }

}

module.exports = Layer;
