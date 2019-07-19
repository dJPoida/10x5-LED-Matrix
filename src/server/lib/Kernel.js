const path = require('path');
const express = require('express');
const EventEmitter = require('events');
const bodyParser = require('body-parser');

const LEDDevice = require('./LEDDevice');
const Blender = require('./Blender');
const ServerSocketHandler = require('./ServerSocketHandler');
const Router = require('../routes/Router');

const KERNEL_EVENTS = require('../../lib/constants/KernelEvents');
const SERVER_SOCKET_MESSAGE = require('../../lib/constants/ServerSocketMessage');

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
    this._blender = new Blender(this);
    this._socketHandler = new ServerSocketHandler(this);
    this._updatingFrame = false;

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
   * @type {Blender}
   */
  get blender() { return this._blender; }


  /**
   * @type {ServerSocketHandler}
   */
  get socketHandler() { return this._socketHandler; }


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
    console.log('Kernel Initialised.');
    this.run();
  }


  /**
   * @description
   * Initialise the kernel
   *
   * @TODO: Error handling
   */
  async initialise() {
    console.log('Kernel initialising...');

    // Initialise the LED Device Controller
    await this.ledDevice.initialise();

    // Initialise the Blender
    await this.blender.initialise();

    // Initialise the Socket Handler
    await this.socketHandler.initialise();

    this._initialised = true;
    this.emit(KERNEL_EVENTS.INITIALISED);
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

    // Start the Frame Update Interval
    this._frameUpdateInterval = setInterval(() => {
      try {
        this.updateFrame();
      } catch (ex) {
        console.error(ex);
      }
    }, 1000 / this.config.fps);
  }


  /**
   * @description
   * Re-draws the frame based on the current display buffer
   */
  async updateFrame() {
    if (this.updatingFrame) {
      console.warn('skipped frame');
      return;
    }
    this._updatingFrame = true;
    try {
    // Get the pixel data from the blender (on its own terms)
      const pixelData = await this.blender.getPixelData();

      this.ledDevice.updatePixelData(pixelData);
      this.emit(KERNEL_EVENTS.FRAME_UPDATE, { pixelData });
      this.socketHandler.sendMessageToClients(SERVER_SOCKET_MESSAGE.EMULATOR_FRAME, { pixelData: Object.values(pixelData) });
    } finally {
      this._updatingFrame = false;
    }
  }


  /**
   * @description
   * Serialise the state of the server application for transport
   *
   * @returns {object}
   */
  serializeState() {
    return {
      some: 'data',
      to: 'do',
    };
  }
}

module.exports = { Kernel, KERNEL_EVENTS };
