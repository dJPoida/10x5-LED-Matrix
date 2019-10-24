/**
 * @description
 * Converts a frame rate to a frame duration (in milliseconds)
 *
 * i.e. 60FPS = 1/60 * 1,000,000 = 16,666.667
 *
 * @param {number} frameRate
 */
const fpsToFrameDuration = (frameRate) => {
  return (1 / frameRate) * 
};

module.exports = fpsToFrameDuration;
