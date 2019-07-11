/**
 * @description
 * Determine if a value is an object with properties (not null and not array)
 *
 * @param {any} value
 * @returns {boolean}
 */
const isObject = value => (typeof value === 'object' && !Array.isArray(value) && value !== null);

module.exports = isObject;
