const path = require('path');
const express = require('express');
const EventEmitter = require('events');
const bodyParser = require('body-parser');
const { performance } = require('perf_hooks');
const readline = require('readline');

const LEDDevice = require('./LEDDevice');
const Scene = require('./Scene');
const ServerSocketHandler = require('./ServerSocketHandler');
const Router = require('../routes/Router');

const fpsToFrameDuration = require('../../lib/helpers/fpsToFrameDuration');
const argb2int = require('../../lib/helpers/argb2int');

const KERNEL_EVENTS = require('../../lib/constants/KernelEvents');
const LAYER_TYPE = require('../../lib/constants/LayerType');
const EFFECT_TYPE = require('../../lib/constants/EffectType');

const distPath = path.resolve(__dirname, '../../../dist');
const clientPath = path.resolve(distPath, 'client');


/**
 * @class Kernel
 * This class controls the main functions of the server application
 */
class Kernel extends EventEmitter {

  /**
  * @constructor
  *
  * @param { http.Server } http  the express http server
  * @param { object } config the loaded configuration
  */
  constructor(server, http, config) {
    super();

    this._server = server;
    this._http = http;
    this._config = config;
    this._initialised = false;
    this._ledDevice = new LEDDevice(this);
    this._Scene = new Scene(this);
    this._socketHandler = new ServerSocketHandler(this);
    this._renderInterval = undefined;
    this._rendering = false;
    this._nextFrameRenderTime = 0;
    this._frameDuration = fpsToFrameDuration(this.config.device.fps);

    this._bindEvents();

    this.initialise();
  }

  /**
   * @type {Express}
   */
  get server() { return this._server; }


  /**
   * @type {Server}
   */
  get http() { return this._http; }


  /**
   * @type {Object}
   */
  get config() { return this._config; }


  /**
   * @type {boolean}
   */
  get initialised() { return this._initialised; }


  /**
   * @type {LEDDevice}
   */
  get ledDevice() { return this._ledDevice; }


  /**
   * @type {Scene}
   */
  get Scene() { return this._Scene; }


  /**
   * @type {ServerSocketHandler}
   */
  get socketHandler() { return this._socketHandler; }


  /**
   * @description
   * Returns true if the frame is currently being rendered to the device
   *
   * @type {boolean}
   */
  get rendering() { return this._rendering; }


  /**
   * @description
   * Bind the event listeners this class cares about
   */
  _bindEvents() {
    this.once(KERNEL_EVENTS.INITIALISED, this._handleInitialised.bind(this));
  }


  /**
   * @description
   * Fired once after the kernel has initialised
   */
  _handleInitialised() {
    console.log('Kernel Initialised.\n');
    this.run();
  }


  /**
   * @description
   * Initialise the kernel
   *
   * @TODO: Error handling
   */
  async initialise() {
    console.log('\nKernel initialising...');

    console.log('Device Width: ', this.config.device.resolution.width);
    console.log('Device Height: ', this.config.device.resolution.height);
    console.log('FPS: ', this.config.device.fps);

    // Initialise the LED Device Controller
    await this.ledDevice.initialise();

    if (!this.ledDevice.hardwareAvailable) {
      console.warn('\n===========================================\nWARNING: LED DEVICE HARDWARE NOT AVAILABLE!\n===========================================\n');
    }

    // TODO: eventually this needs to be loaded by the current "sequence" which should be stored in a db or json somewhere for configuration by the user
    // Initialise the Scene
    await this.Scene.initialise(
      {
        id: 'testScene',
        name: 'Test Scene',
        layers: [
          // Red Knight Rider Layer
          {
            id: 'redKnightRiderLayer',
            name: 'Red Knight Rider Layer',
            type: LAYER_TYPE.KNIGHT_RIDER,
            options: {
              sweepDuration: 3000,
            },
            effects: [
              {
                type: EFFECT_TYPE.DECAY,
                options: {
                  alphaOffset: 0.5,
                  duration: 500,
                },
              },
            ],
          },

          // Clock Layer
          {
            id: 'clockLayer',
            name: 'Clock Layer',
            type: LAYER_TYPE.CLOCK,
            options: {
              color: argb2int(255, 0, 255, 0),
            },
            effects: [
              {
                type: EFFECT_TYPE.DECAY,
                options: {
                  alphaOffset: 0.9,
                  duration: 500,
                },
              },
            ],
          },
        ],
      },
    );

    // Initialise the Socket Handler
    await this.socketHandler.initialise();

    this._initialised = true;
    this.emit(KERNEL_EVENTS.INITIALISED);
  }


  /**
   * @description
   * Run the application
   */
  async run() {
    console.log('Kernel Running...');

    // development
    if (this.server.get('mode') === 'development') {
      // use a webpack dev server with hot middleware
      console.log('Development Environment: Starting Webpack Hot Reload...');

      // eslint-disable-next-line import/no-extraneous-dependencies, global-require
      const webpack = require('webpack');

      // eslint-disable-next-line import/no-extraneous-dependencies, global-require
      const webpackDevMiddleware = require('webpack-dev-middleware');

      // eslint-disable-next-line global-require, import/no-dynamic-require
      const webpackConfig = require(process.env.WEBPACK_CONFIG ? process.env.WEBPACK_CONFIG : '../../../webpack.config');
      const compiler = webpack(webpackConfig);

      this.server.use(webpackDevMiddleware(
        compiler, {
          logLevel: 'warn',
          publicPath: webpackConfig.output.publicPath,
        },
      ));

      // Attach the hot middleware to the compiler & the server
      // eslint-disable-next-line import/no-extraneous-dependencies, global-require
      this.server.use(require('webpack-hot-middleware')(
        compiler, {
          log: console.log,
          path: '/__webpack_hmr',
          heartbeat: 2 * 1000,
        },
      ));
    // production
    } else {
      console.log('Production Environment');
    }

    // middleware
    this.server.use(bodyParser.json());

    // public assets
    this.server.use(express.static(path.resolve(clientPath)));

    // API Routes
    this.server.use(Router.registerRoutes(this.server, this));

    // host server
    try {
      this.http.listen(this.config.server.port, () => {
        console.log(`listening on port ${this.config.server.port}`);
      });
    } catch (ex) {
      throw new Error(`Failed to begin http server on port ${this.config.server.port}: ${ex}`);
    }

    // Begin the Render Loop
    this.renderLoop();
  }


  /**
   * @description
   * This is the main render loop of the application which is responsible
   * for waiting the appropriate amount of time for each render.
   */
  async renderLoop() {
    // Has the current time exceeded the time the next frame is supposed to render?
    if (performance.now() > this._nextFrameRenderTime) {
      if (!this.rendering) {
        // Before we start rendering this layer, determine when the next frame should be rendered.
        this._nextFrameRenderTime = performance.now() + this._frameDuration;

        // Render the frame
        const renderResult = await this.render();

        const frameRenderDuration = ((renderResult && renderResult.stats.renderDuration) || this._frameDuration);
        const complexity = (frameRenderDuration / this._frameDuration);
        const theoreticalFrameRate = (1000 / frameRenderDuration);

        process.stdout.write(`Frame Render Duration: ${
          frameRenderDuration.toFixed(3)
        }ms (Complexity: ${
          (complexity * 100).toFixed(2)
        }%) (MaxFPS: ${
          theoreticalFrameRate.toFixed(2)
        }fps)`);
        readline.cursorTo(process.stdout, 0);

        // Notify anything that cares about the frame data
        this.emit(KERNEL_EVENTS.FRAME_UPDATE, renderResult);
      } else {
        // Frame Overdue!
        // TODO: what to do here?
      }
    }

    // Check again in 1ms. (reduce this to 0 to get the best performance. 1ms gives us some CPU respite)
    setTimeout(this.renderLoop.bind(this), 1);
  }


  /**
   * @description
   * Re-draws the frame based on the current display buffer
   *
   * @returns {{
   *  pixelData: Uint32Array,
   *  stats: {
   *    renderDuration: number,
   *    layerRenderDurations: {},
   *  }
   * }}
   */
  async render() {
    // Don't allow another render to start while this render is in motion
    if (this.rendering) return {};

    // Keep track of the fact we're rendering so that we don't render twice at the same time
    this._rendering = true;

    // Log the start time
    const renderStartTime = performance.now();
    let renderResult;
    let renderDuration;
    let result;
    try {
      // Get the pixel data from the Scene
      renderResult = await this.Scene.render();

      // Keep track of the time this frame render finished
      renderDuration = (performance.now() - renderStartTime);

      // TODO: keep some kind of average frame rate

      // Was there an error?
      if (renderResult.error) {
        // TODO: what to do with the Scene errors?
      } else {
        result = {
          pixelData: renderResult.pixelData,
          stats: {
            renderDuration,
            layerRenderDurations: renderResult.layerRenderDurations,
          },
        };
      }

    } finally {
      this._rendering = false;
    }

    return result;
  }


  /**
   * @description
   * Serialise the state of the server application for transport
   *
   * @param {boolean} includePixelData whether or not to include the current pixel data in the response
   *
   * @returns {object}
   */
  async serializeState(includePixelData) {
    const state = {
      ledDevice: this.ledDevice.serializeState(),
    };

    if (includePixelData) {
      state.pixelData = await this.Scene.getPixelData();
    }

    return state;
  }
}

module.exports = { Kernel, KERNEL_EVENTS };
