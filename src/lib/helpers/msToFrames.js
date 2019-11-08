/**
 * @description
 * Converts a duration in ms to the number of elapsed frames (Math.floored)
 *
 * i.e. 1500ms @ 60fps = 90 frames
 *
 * @param {number} duration the duration in ms
 * @param {number} frameRate the current system frame rate
 */
const msToFrames = (duration, frameRate) => Math.floor(duration / (1 / frameRate) * 1000);

module.exports = msToFrames;
