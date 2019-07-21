const LAYER_TYPES = {
  // Nothing special about this layer but pixels can be assigned
  BORING: 'boring',

  // Fill the screen with an ARGB test patten with 4x colours red, green, blue and white
  TEST_PATTERN: 'testPattern',

  // TODO: fill a layer with an ARGB value
  SOLID_COLOR: 'solidColour',

  // TODO: allow the user to provide a set of X/Y coordinates and ARGB values for setting up a simple layer
  X_Y_ARGB: 'xyargb',

  // TODO: A scrolling bar from left to right like the grill on the Knight Rider car
  KNIGHT_RIDER: 'knightRider',
};

module.exports = LAYER_TYPES;
