const LAYER_TYPE = {
  // Basically a text layer that displays the current time
  CLOCK: 'CLOCK',

  // A layer that displays a pixel map (like a bitmap) but only in one color
  MONO_PIXEL_MAP: 'MONO_PIXEL_MAP',

  // A scrolling bar from left to right like the KITT scanner (Larson Scanner) on the Knight Rider car
  KNIGHT_RIDER: 'KNIGHT_RIDER',

  // A Solid colour layer that pulses
  PULSE: 'PULSE',

  // Simple Layer Filled with an ARGB value
  FILL: 'FILL',

  // Fills the screen with an ARGB test patten with 4x colours red, green, blue and white
  TEST_PATTERN: 'TEST_PATTERN',

  // Renders out some text
  TEXT: 'TEXT',
};

module.exports = LAYER_TYPE;
