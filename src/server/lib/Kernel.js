const path = require('path');
const express = require('express');
const EventEmitter = require('events');
const bodyParser = require('body-parser');

const LEDDevice = require('./LEDDevice');
const LayerBlender = require('./LayerBlender');
const Router = require('../routes/Router');

const KERNEL_EVENTS = require('../../lib/constants/KernelEvents');

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
    this._ledDevice = undefined;
    this._layerBlender = undefined;

    this.bindEvents();

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
   * @type {layerBlender}
   */
  get layerBlender() { return this._layerBlender; }


  /**
   * @description
   * Initialise the kernel
   */
  async initialise() {
    console.log('Kernel initialising...');

    // Create the LED Device Controller
    this._ledDevice = new LEDDevice(this);
    await this.ledDevice.initialise();

    // Crete the layer blender
    this._layerBlender = new LayerBlender(this);
    await this.layerBlender.initialise();

    this._initialised = true;
    this.emit(KERNEL_EVENTS.INITIALISED);
  }


  /**
   * @description
   * Bind the event listeners this class cares about
   */
  bindEvents() {
    this.once(KERNEL_EVENTS.INITIALISED, this.handleInitialised.bind(this));
  }


  /**
   * @description
   * Fired once after the kernel has initialised
   */
  handleInitialised() {
    console.log('Kernel Initialised.');
    this.run();
  }


  /**
   * @description
   * Run the application
   */
  run() {
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
  }
}

module.exports = { Kernel, KERNEL_EVENTS };
