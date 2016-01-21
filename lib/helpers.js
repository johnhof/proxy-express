var _ = require('lodash');
var URL = require('url');

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
};

// Matches Filter
//
// test a filter against a request. Accepts
// + RegExp   - returns true if RegExp.test matches req.url.path
// + String   - returns true if req.url.path.find(String) > -1
// + Boolean  - true if true, false if false
// + Function returning any supported type (including Function)
// + Array containing any any supported type (including Array)
//
exports.matchesRestriction = function matchesRestriction(req, filter) {
  while(_.isFunction(filter)) {
    filter = filter(req);
  }

  if(_.isArray(filter)) {
    return Boolean(_.find(filter,matchesRestriction.bind(req,req)));
  }

  if(_.isBoolean( filter )) {
    return filter;
  }

  var reqUrlPath = URL.parse(req.url).path;
  // if the filter is a regex and it matched the path
  if (_.isRegExp(filter)) {
    return filter.test(reqUrlPath);
  }

  // if the filter is a string and its contained in the path
  if (_.isString(filter)) {
    return reqUrlPath.indexOf(filter) !== -1;
  }

  // if the filter isn't valid, return true
  return true;
};