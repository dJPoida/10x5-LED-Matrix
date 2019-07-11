const isObject = require('./isObject');

/**
 * @name updateObject
 *
 * @description
 * Update the properties of a target object with those found in a source object
 * AND remove any properties in the target that are NOT in the source
 *
 * @param { object } target the target object to update             (i.e. defaultConfig)
 * @param { object } source the source object to pull values from   (i.e. config.json)
 */
const updateObject = (target, source) => {
  if (target === undefined || source === undefined) {
    return;
  }

  Object.keys(source).forEach((key) => {
    // if the key is in the target, set it to the source key
    if (key in target) {
      if (isObject(source[key])) {
        updateObject(target[key], source[key]);
      } else target[key] = source[key];
    }
  });
};

module.exports = updateObject;
