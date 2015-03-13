var request = require('request');
var _       = require('lodash');
var URL     = require('url');
var async   = require('async');
var colors  = require('colors');
var helpers = require('./helpers');

////////////////////////////////////////////////////////////
//
// Middleware setup
//
////////////////////////////////////////////////////////////

module.exports = function (host, options) {
  if (typeof host !== 'string') { throw new Error('express-proxy expects `host` to be a string'); }

  if (typeof options === 'string') {
    options =  {
      prefix : options
    };

  } else if (typeof options === 'RegExp') {
    options = {
      restrict : {
        match : options
      }
    };
  }

  var stream = buildStream(host, options);

  return buildResultingMiddleware(host, options, stream);
}

////////////////////////////////////////////////////////////
//
// Stream setup
//
////////////////////////////////////////////////////////////

// construct the async waterfall stream
//
// acccept
// buildStream(host)
//      OR
// buildStream(host, secureBool)
//      OR
// buildStream(host, secureBool)
//      OR
// buildStream(host, prefix, secureBool)
//      OR
// buildStream(host, optionsObj)
//
function buildStream (host, options, secure) {
  var stream = [];

  // accept options as a secure boolean
  if (options === true) {
    secure = true;
  }

  options = _.defaults(_.isObject(options) ? options : {}, {
    request  : {},
    response : {}
  });

  function applyStreamFunctions (funcSet) {
    _.each(funcSet || [], function (middleware) {
      if (_.isFunction(middleware)) {
        // wrapper allows us to call the callback without passing proxyObj
        stream.push(function asyncWrapper (proxyObj, callback) {
          return middleware(proxyObj, function (error, _proxyObj) {
            return callback(error, _proxyObj || proxyObj);
          })
        });
      }
    });
  }

  // if there is `pre` middleware
  var preSet = options.pre;
  if (preSet) {
    // accept raw functions, but wrap it in an array
    preSet = _.isFunction(preSet) ? [preSet] : preSet;
    applyStreamFunctions(preSet);
  }

  // push the core request
  stream.push(proxyReq);

  // if there is `post` middleware
  var postSet = options.post;
  if (postSet) {
    // accept raw functions, but wrap it in an array
    postSet = _.isFunction(postSet) ? [postSet] : postSet;
    applyStreamFunctions(postSet);
  }

  if (secure) {
    options.request.forceHttps = true;
  }

  return stream;
}

////////////////////////////////////////////////////////////
//
// Resulting middleware
//
////////////////////////////////////////////////////////////

function buildResultingMiddleware (host, options, sharedStream) {
  return function proxyMiddleware (req, res, next) {
    var stream = _.clone(sharedStream, true);
    var reqUrl = URL.parse(req.url, true);
    var proxyUrl  = {
      pathname : reqUrl.pathname,
      protocol : options.request.forceHttps ? 'https' : req.protocol,
      host     : host
    }

    //
    // Check user defined proxy conditions
    //

    var shouldProxy = true;

    // If there is a prefix, it must match the route to continue
    if (typeof options.prefix === 'string') {
      var prefix = options.prefix[0] == '/' ? options.prefix : '/' + options.prefix;

      // if thre prefix failed to match, set shouldProxy to false
      if ((reqUrl.pathname || '').indexOf(prefix) !== 0) {
        shouldProxy = false;

        // otherwise, remove the prefix and continue
      } else {
        proxyUrl.pathname = proxyUrl.pathname.replace(prefix, '');
      }
    }

    // if there are restricts applied, and we havent failed out yet
    if (options.restrict && shouldProxy) {
      // if its a lone restrict, and it doesnt match the url
      if (_.isRegExp(options.restrict) || _.isString(options.restrict)) {
        shouldProxy = helpers.matchesRestriction(reqUrl.path, options.restrict);

      // if its an array of restricts
      } else if (_.isArray(options.restrict)) {
        var passedOne = false;
        _.each(options.restrict, function (restriction) {
          if (helpers.matchesRestriction(reqUrl.path, restriction)) {
            passedOne = true;
            return false; // exit the loop
          }
        });

        shouldProxy = passedOne;
      }
    }

    // if the current route isn't greenlit for the passthrough, bail out
    if (!shouldProxy) { return next(); }

    //
    // compile the request object used for the `request` module call
    //

    req.headers.host = host;

    var reqOpts = {
      url     :  URL.format(proxyUrl),
      method  : req.method,
      form    : _.defaults(options.request.form, req.body),
      qs      : _.defaults(options.request.query, req.query),
      headers : helpers.defaultHeaders(options.request.headers, req.headers),
      followAllRedirects : options.request.followRedirects !== false ? true : false
    };

    // if the route is greenlit, add the proxy option builder to the stream
    stream.unshift(function (callback) {
      return callback(null, {
        req     : req,
        res     : res,
        reqOpts : reqOpts,
        options : options
      });
    });

    // header cleanup before request
    res.removeHeader("x-powered-by");

    return async.waterfall(stream, respond(next));
  }
}


////////////////////////////////////////////////////////////
//
// Stream functions
//
////////////////////////////////////////////////////////////

//
// async function to make the proxied request (fires between brefore `pre` and `post` functions)
//
function proxyReq (proxyObj, callback) {
  var proxyError = proxyObjErrors(proxyObj)
  if (proxyError) { return callback(new Error(proxyError)); }

  if (proxyObj.options.log) { logReqOpts(proxyObj.reqOpts) }

  // TESTING HELPER ONLY
  if (proxyObj.options.shortCircuit) { return callback(null, proxyObj); }

  // unless explicitly set, ignore encoding
  // THIS IS A HACK THAT MAY CAUSE ISSUES. I DON'T
  // KNOW OF AN IMMEDIATE WORKAROUND TO FIX IT.
  if (!proxyObj.options['accept-encoding']) {
    delete proxyObj.reqOpts.headers['accept-encoding'];
  }

 // make request
  request(proxyObj.reqOpts, function (error, response, body) {
    if (proxyObj.options.log) { logResponse(response, body); }

    // transfer result to resulting o
    proxyObj.res.set(helpers.defaultHeaders(proxyObj.options.response.headers, response ? response.headers : {}));

    proxyObj.result = {
      response : response,
      body     : body
    };

    return callback(error, proxyObj);
  });
}

//
// respond with proxied result (fires at the end of all middleware execution)
//
function respond (next) {
  return function sendResult (error, proxyObj) {
    if (error) { return next(error); }

    // TESTING HELPER ONLY
    if (proxyObj.options.shortCircuit) {
      return proxyObj.res.send({
        result: 'Express-proxy set to short circuit. If this is not expected, please check your config'
      });
    }

    var proxyError = proxyObjErrors(proxyObj)
    if (proxyError) {
      return next(new Error(proxyError));

    } else if (!(proxyObj.result && proxyObj.result.response)) {
      return next(new Error('Proxy to ' + proxyObj.reqOpts.url + ' failed for an unkown reason'));

    } else {
      proxyObj.res.send(proxyObj.result.body);
    }
  }
}

////////////////////////////////////////////////////////////
//
// Helpers
//
////////////////////////////////////////////////////////////

function proxyObjErrors (proxyObj) {
  if (!proxyObj) { return '`proxyObj` not defined'; }

  var errors   = '';
  var expected = ['req', 'req', 'reqOpts', 'options'];

  _.each(expected, function (expect, index) {
    if (!proxyObj[expect]) {
      errors += (index ? ', ' : '') + 'Missing property: `' + expect + '`';
    }
  });

  return errors ? 'Errors found in `proxyObj`: [' + errors + ']' : false;
}


function logReqOpts (reqOpts) {
  reqOpts = reqOpts || {};

  console.log('\n>>>>>>>> Request >>>>>>>\n'.cyan);

  console.log('=====     URL     =====\n'.yellow);
  console.log('  ' + (reqOpts.method || '').green + ' ' + (reqOpts.url || ''));

  console.log('\n=====   Headers   =====\n'.yellow);
  console.log(JSON.stringify(reqOpts.headers || {}, null, '  '));

  console.log('\n=====    Form     =====\n'.yellow);
  console.log(JSON.stringify(reqOpts.form || {}, null, '  ') + '\n');
}


function logResponse (response, body) {
  response = response || {};
  console.log('\n<<<<<<<< Response <<<<<<<\n'.cyan);

  console.log('=====    Status   =====\n'.yellow);
  console.log(response.statusCode + '\n');

  console.log('=====   Headers   =====\n'.yellow);
  console.log(JSON.stringify((response).headers || {}, null, '  '));

  console.log('\n=====     Body     =====\n'.yellow);
  console.log('  type: [' + (typeof body) + ']\n');
}