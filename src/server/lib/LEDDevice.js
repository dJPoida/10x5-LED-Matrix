const ws281x = require('rpi-ws281x-native');
const EventEmitter = require('events');

const LED_DEVICE_EVENTS = require('../../lib/constants/LEDDeviceEvents');

class LEDDevice extends EventEmitter {

  /**
  * @constructor
  *
  * @param {Kernel} kernel
  */
  constructor(kernel) {
    super();
    this._kernel = kernel;
    this._fps = kernel.config.device.fps || 60;
    this._brightness = kernel.config.device.defaultBrightness || 192;
    this._device = ws281x;
    this._frameUpdateInterval = undefined;
    this._pixelData = new Uint32Array(this.numLEDs);

    this.bindEvents();
  }

  /**
   * @type {Kernel}
   */
  get kernel() { return this._kernel; }


  /**
   * @type {ws281x}
   */
  get device() { return this._device; }


  /**
   * @type {Config}
   */
  get config() { return this.kernel.config; }


  /**
   * @type {number}
   */
  get width() { return this.config.device.resolution.width; }


  /**
   * @type {number}
   */
  get height() { return this.config.device.resolution.height; }


  /**
   * @type {number}
   */
  get numLEDs() { return this.config.device.resolution.numLEDs; }


  /**
   * @type {number}
   */
  get fps() { return this._fps; }


  /**
   * @type {number}
   */
  get brightness() { return this._brightness; }


  /**
   * @type {Uint32Array}
   */
  get pixelData() { return this._pixelData; }


  /**
   * @description
   * Bind the event listeners this class cares about
   */
  bindEvents() {
    this.once(LED_DEVICE_EVENTS.INITIALISED, this.handleInitialised.bind(this));

    // trap the SIGINT and reset before exit
    process.on('SIGINT', this.handleApplicationTerminate.bind(this));
  }


  /**
   * @description
   * Initialise the LED Device
   */
  async initialise() {
    console.log('LED Device initialising...');

    // Initialise the LED Driver
    this.device.init(this.numLEDs);

    // Initialise the Index Map
    if (Array.isArray(this.kernel.config.pixelIndexMap)) {
      this.device.setIndexMapping(this.kernel.config.pixelIndexMap);
    }

    // Set the Brightness
    this.device.setBrightness(this.brightness);

    // Initialise the frame update timer
    this._frameUpdateInterval = setInterval(this.updateFrame.bind(this), this.kernel.config.fps);

    // Let everyone know that the LED Device is initialised
    this.emit(LED_DEVICE_EVENTS.INITIALISED);
  }


  /**
   * @description
   * Fired when the LED Device is initialised
   */
  handleInitialised() {
    console.log('LED Device Initialised.');
  }


  /**
   * @description
   * Fired by the application JUST before process termination
   */
  handleApplicationTerminate() {
    this.device.reset();
    process.nextTick(() => { process.exit(0); });
  }


  /**
   * @description
   * Re-draws the frame based on the current display buffer
   */
  updateFrame() {
    // @TODO: create some kind of mutex to prevent these variables from being accessed at the same time
    this._pixelData = [...this.kernel.layerBlender.pixelData];

    this.device.render(this.pixelData);
    this.emit(LED_DEVICE_EVENTS.FRAME_UPDATE);
  }
}

module.exports = LEDDevice;
