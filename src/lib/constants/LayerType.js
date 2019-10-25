const LAYER_TYPE = {
  // Basically a text layer that displays the current time
  CLOCK: 'CLOCK',

  // A temporary layer that displays a ghost from Pacman. Mainly used for testing
  GHOST: 'GHOST',

  // A scrolling bar from left to right like the KITT scanner (Larson Scanner) on the Knight Rider car
  KNIGHT_RIDER: 'KNIGHT_RIDER',

  // A Solid colour layer that pulses
  PULSE: 'PULSE',

  // Simple Layer Filled with an ARGB value
  SOLID_COLOR: 'SOLID_COLOR',

  // Fills the screen with an ARGB test patten with 4x colours red, green, blue and white
  TEST_PATTERN: 'TEST_PATTERN',

  // Renders out some text
  TEXT: 'TEXT',
};

module.exports = LAYER_TYPE;
