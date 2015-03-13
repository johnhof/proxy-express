var _ = require('lodash')

// Default Headers
//
// defaults a flat object of headers. undefined deletes the header
//
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

// Matches Filter
//
// test a filter against a path. Accepts regex and substring
//
exports.matchesRestriction = function (path, filter) {
  // if the filter is a regex and it matched the path
  if (_.isRegExp(filter)) {
    return filter.test(path);

  // if the filter is a string and its contained in the path
  } else if (_.isString(filter)) {
    return path.indexOf(filter) !== -1;

    // if the filter isn't valid, return true
  } else {
    return true;
  }
}