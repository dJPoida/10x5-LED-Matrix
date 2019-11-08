const secondsMultiplier = 1000;
const minutesMultiplier = (secondsMultiplier * 60);
const hoursMultiplier = (minutesMultiplier * 60);
const daysMultiplier = (hoursMultiplier * 24);

/**
 * @description
 * Converts a performance.now() (i.e. a millisecond timestamp value) into days, hours, minutes
 * seconds and frames (based on the currently configured FPS of the system)
 *
 * @param {number} duration the timestamp including milliseconds
 * @param {number} fps the configured FPS of the system
 *
 * @returns {{
 *  days: number,
 *  hours: number,
 *  minutes: number,
 *  seconds: number,
 *  frames: number,
 * }}
 */
const msToTimeCode = (duration, fps) => {
  let remainder = duration;

  // Days
  const days = Math.floor(remainder / daysMultiplier);
  remainder -= (daysMultiplier * days);

  // Hours
  const hours = Math.floor(remainder / hoursMultiplier);
  remainder -= (hoursMultiplier * hours);

  // Minutes
  const minutes = Math.floor(remainder / minutesMultiplier);
  remainder -= (minutesMultiplier * minutes);

  // Seconds
  const seconds = Math.floor(remainder / secondsMultiplier);
  remainder -= (secondsMultiplier * seconds);

  // Frames
  const frames = Math.floor(remainder / ((1 / fps) * 1000));

  return {
    days,
    hours,
    minutes,
    seconds,
    frames,
  };
};

module.exports = msToTimeCode;
