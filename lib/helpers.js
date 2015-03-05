var _ = require('lodash')

exports.defaultHeaders = function (overrideObj, defaultObj) {
  var result = defaultObj ? _.clone(defaultObj) : {};

  _.each(Object.keys(overrideObj || {}), function (key) {
    // delete anything explicitly set to undefined
    if (overrideObj[key] === undefined && (key in result)) {
      delete result[key];

    // override all other values regardless
    } else if (_.isString(overrideObj[key])) {
      result[key] = overrideObj[key];
    }
  });

  return result;
}