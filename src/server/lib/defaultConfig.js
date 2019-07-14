const defaultConfig = {
  configured: false,
  server: {
    port: 3000,
  },
  device: {
    fps: 60,
    // @todo: Still haven't figured out a way to properly apply GPIO values to the ws281x library
    ledGPIO: 18,
    defaultBrightness: 192,
    resolution: {
      width: 16,
      height: 16,
    },
    pixelIndexMap: null,
  },
};

module.exports = defaultConfig;
