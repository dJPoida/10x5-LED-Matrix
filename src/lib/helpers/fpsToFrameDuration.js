/**
 * @description
 * Converts a frame rate to a frame duration (in milliseconds)
 *
 * i.e. 60FPS = 1/60 * 1,000 = 16.667
 *
 * @param {number} frameRate
 */
const fpsToFrameDuration = frameRate => (1 / frameRate) * 1000;

module.exports = fpsToFrameDuration;
