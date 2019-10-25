const argbBlend = require('./argbBlend');

/**
 * @description
 * Blends two ARGB pixel values together (using additive)
 *
 * @see https://gist.github.com/JordanDelcros/518396da1c13f75ee057
 *
 * @param {Uint32Array} baseLayer an array of 32bit pixels to use as the base layer
 * @param {Uint32Array} addedLayer an array of 32bit pixels to overlay over the baseLayer
 */
const argbBlendLayer = (baseLayer, addedLayer) => {
  // Check that each layer is a Uint32Array
  if (!baseLayer || baseLayer.constructor !== Uint32Array) throw new Error('argbBlendLayer: baseLayer must be of type Uint32Array');
  if (!addedLayer || addedLayer.constructor !== Uint32Array) throw new Error('argbBlendLayer: addedLayer must be of type Uint32Array');

  // Check that the layers sizes match
  if (baseLayer.length !== addedLayer.length) throw new Error('argbBlendLayer: baseLayer and addedLayer must be of the same size');

  // const result = Uint32Array(baseLayer.length);
  // for (let p = 0; p < baseLayer.length; p += 1) {
  //   newPixelData[p] = argbBlend(newPixelData[p], layerPixelData[p]);
  // }

  return baseLayer.map((p, index) => argbBlend(p, addedLayer[index]));
};

module.exports = argbBlendLayer;
