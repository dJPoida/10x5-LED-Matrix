/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-constructor */

class Effect {

  /**
   * @constructor
   *
   * @param {object} [options={}]
   */
  constructor(options) {
    //
  }


  /**
   * @description
   * Apply the affect to the incoming pixel data
   *
   * @param {Uint32Array} pixelData the pixels to apply the affect to
   */
  apply(pixelData) {
    return new Uint32Array(pixelData);
  }
}

module.exports = Effect;
