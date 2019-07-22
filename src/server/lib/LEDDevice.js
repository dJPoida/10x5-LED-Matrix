const ws281x = require('rpi-ws281x-native');
const EventEmitter = require('events');

const LED_DEVICE_EVENT = require('../../lib/constants/LEDDeviceEvent');
const KERNEL_EVENTS = require('../../lib/constants/KernelEvents');

/**
 * @class LEDDevice
 *
 * @description
 * This class is responsible for controlling the ws281x device
 */
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

    this._bindEvents();
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
   * @type {boolean}
   * @description returns true if the raspberry pi could be initialised with the ws281x library
   */
  get hardwareAvailable() { return this.device && !this.device.isStub(); }


  /**
   * @description
   * Bind the event listeners this class cares about
   */
  _bindEvents() {
    this.once(LED_DEVICE_EVENT.INITIALISED, this._handleInitialised.bind(this));

    // Listen for frame update events on the kernel and push the pixel data to the led device
    this.kernel.on(KERNEL_EVENTS.FRAME_UPDATE, this._handleFrameUpdate.bind(this));

    // trap the SIGINT and reset before exit
    process.on('SIGINT', this._handleApplicationTerminate.bind(this));
  }


  /**
   * @description
   * Fired when the LED Device is initialised
   */
  _handleInitialised() {
    console.log('LED Device Initialised.');
  }


  /**
   * @description
   * Fired by the application JUST before process termination
   */
  _handleApplicationTerminate() {
    this.device.reset();
    process.nextTick(() => { process.exit(0); });
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
    if (Array.isArray(this.kernel.config.device.pixelIndexMap)) {
      console.log('Applying custom pixel index mapping');
      this.device.setIndexMapping(this.kernel.config.device.pixelIndexMap);
    }

    // Set the Brightness
    this.device.setBrightness(this.brightness);

    // Let everyone know that the LED Device is initialised
    this.emit(LED_DEVICE_EVENT.INITIALISED);
  }


  /**
   * @description
   * Re-draws the frame based on the current display buffer
   */
  _handleFrameUpdate(frame) {
    this._pixelData = [...frame.pixelData];
    this.device.render(this.pixelData);
  }


  /**
   * @description
   * Serialise the state of the server application for transport
   *
   * @returns {object}
   */
  serializeState() {
    return {
      hardwareAvailable: this.hardwareAvailable,
      width: this.width,
      height: this.height,
      brightness: this.brightness,
      fps: this.fps,
    };
  }
}

module.exports = LEDDevice;
