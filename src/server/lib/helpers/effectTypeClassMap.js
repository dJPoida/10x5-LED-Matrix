const EFFECT_TYPE = require('../constants/EffectType');

const DecayEffect = require('../Effects/DecayEffect');

const _effectTypeClassMap = {
  [EFFECT_TYPE.DECAY]: DecayEffect,
};


/**
 * @description
 * Map an EFFECT_TYPE to a class for instantiation
 *
 * @param {EFFECT_TYPE} effectType
 *
 * @returns {Effect}
 */
const effectTypeClassMap = (effectType) => {
  if (!Object.values(EFFECT_TYPE).includes(effectType)) throw new Error(`Invalid EFFECT_TYPE passed to effectTypeClassMap(): "${effectType}"`);

  return _effectTypeClassMap[effectType];
};

module.exports = effectTypeClassMap;
