const LAYER_TYPE = require('../constants/LayerType');

// eslint-disable-next-line no-unused-vars
const Layer = require('../../server/lib/Layers/Layer');

const ClockLayer = require('../../server/lib/Layers/ClockLayer');
const GhostLayer = require('../../server/lib/Layers/GhostLayer');
const KnightRiderLayer = require('../../server/lib/Layers/KnightRiderLayer');
const PulseLayer = require('../../server/lib/Layers/PulseLayer');
const SolidColorLayer = require('../../server/lib/Layers/SolidColorLayer');
const TestPatternLayer = require('../../server/lib/Layers/TestPatternLayer');
const TextLayer = require('../../server/lib/Layers/TextLayer');

const _layerTypeClassMap = {
  [LAYER_TYPE.CLOCK]: ClockLayer,
  [LAYER_TYPE.GHOST]: GhostLayer,
  [LAYER_TYPE.KNIGHT_RIDER]: KnightRiderLayer,
  [LAYER_TYPE.PULSE]: PulseLayer,
  [LAYER_TYPE.SOLID_COLOR]: SolidColorLayer,
  [LAYER_TYPE.TEST_PATTERN]: TestPatternLayer,
  [LAYER_TYPE.TEXT]: TextLayer,
};


/**
 * @description
 * Map an LAYER_TYPE to a class for instantiation
 *
 * @param {LAYER_TYPE} layerType
 *
 * @returns {Layer}
 */
const layerTypeClassMap = (layerType) => {
  if (!Object.values(LAYER_TYPE).includes(layerType)) throw new Error(`Invalid LAYER_TYPE passed to layerTypeClassMap(): "${layerType}"`);

  return _layerTypeClassMap[layerType];
};

module.exports = layerTypeClassMap;
