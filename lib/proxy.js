'use strict';

const cloudscraper = require('cloudscraper');
const request = require('request');
const _       = require('lodash');
const URL     = require('url');
const async   = require('async');
const colors  = require('colors');
const helpers = require('./helpers');

////////////////////////////////////////////////////////////
//
// Middleware setup
//
////////////////////////////////////////////////////////////

module.exports = function (host, options, secure) {
  if (typeof host !== 'string') {
    throw new Error('proxy-express expects `host` to be a string');
  }

  options = helpers.buildOptions(options);

  let stream = buildStream(host, options, secure);

  return buildResultingMiddleware(host, options, stream);
};

////////////////////////////////////////////////////////////
//
// Stream setup
//
////////////////////////////////////////////////////////////

// construct the async waterfall stream
//
// accept
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
          return middleware(proxyObj, (error, _proxyObj) => callback(error, _proxyObj || proxyObj));
        });
      }
    });
  }

  // if there is `pre` middleware
  let preSet = options.pre;
  if (preSet) {
    // accept raw functions, but wrap it in an array
    preSet = _.isFunction(preSet) ? [preSet] : preSet;
    applyStreamFunctions(preSet);
  }

  // push the core request
  stream.push(proxyReq);

  // if there is `post` middleware
  let postSet = options.post;
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
    let stream = _.clone(sharedStream, true);
    let reqUrl = URL.parse(req.url, true);
    let proxyUrl = {
      pathname : reqUrl.pathname,
      protocol : options.request.forceHttps ? 'https' : req.protocol,
      host     : host
    };

    //
    // Check user defined proxy conditions
    //

    var shouldProxy = true;

    // If there is a prefix, it must match the route to continue
    if (typeof options.prefix === 'string') {
      let prefix = options.prefix[0] === '/' ? options.prefix : '/' + options.prefix;

      // if thre prefix failed to match, set shouldProxy to false
      if ((reqUrl.pathname || '').indexOf(prefix) !== 0) {
        shouldProxy = false;

        // otherwise, remove the prefix and continue
      } else {
        proxyUrl.pathname = proxyUrl.pathname.replace(prefix, '');
      }
    }

    if (typeof options.request.prepend === 'string') {
      proxyUrl.pathname = (/^\//.test(options.request.prepend) ? options.request.prepend : '/' + options.request.prepend) + (/^\//.test(proxyUrl.pathname) ? proxyUrl.pathname : '/' + proxyUrl.pathname);
    }

    // if there are restricts applied, and we havent failed out yet
    if (options.restrict && shouldProxy) {
      shouldProxy = helpers.matchesRestriction(req, options.restrict);
    }

    // if the current route isn't greenlit for the passthrough, bail out
    if (!shouldProxy) { return next(); }

    let encoding;
    // Handle Image Files
    if (/jpe?g|gif|png|ico|bmp|tiff/i.test(req.url)) {
      encoding = null;
    }

    //
    // compile the request object used for the `request` module call
    //

    req.headers.host = host;

    let reqOpts = {
      url     : URL.format(proxyUrl),
      method  : req.method,
      form    : _.defaults(options.request.form, req.body),
      qs      : _.defaults({}, options.request.query, req.query),
      headers : helpers.defaultHeaders(options.request.headers, req.headers),
      encoding: encoding,
      followAllRedirects : options.request.followRedirects !== false,
      strictSSL: options.request.strictSSL !== undefined ? options.request.strictSSL : true
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
    res.removeHeader('x-powered-by');

    return async.waterfall(stream, respond(next));
  };
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
  let proxyError = proxyObjErrors(proxyObj);
  if (proxyError) { return callback(new Error(proxyError)); }

  if (proxyObj.options.log) { logReqOpts(proxyObj.reqOpts); }

  // TESTING HELPER ONLY
  if (proxyObj.options.shortCircuit) { return callback(null, proxyObj); }

  // unless explicitly set, ignore encoding
  // THIS IS A HACK THAT MAY CAUSE ISSUES. I DON'T
  // KNOW OF AN IMMEDIATE WORKAROUND TO FIX IT.
  if (!proxyObj.options['accept-encoding']) {
    delete proxyObj.reqOpts.headers['accept-encoding'];
  }

  // Check for Form Post Parameters
  if (proxyObj.req.body && (proxyObj.reqOpts.method === 'POST' || proxyObj.reqOpts.method === 'PUT')) {
    proxyObj.reqOpts.form = proxyObj.req.body;
  }

  // make request
  var requester = request;
  if(proxyObj.options.cloudflare == true)
    requester = cloudscraper.request;

  requester(proxyObj.reqOpts, function (error, response, body) {
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
        result: 'proxy-express set to short circuit. If this is not expected, please check your config'
      });
    }

    let proxyError = proxyObjErrors(proxyObj);
    if (proxyError) {
      return next(new Error(proxyError));
    } else if (!(proxyObj.result && proxyObj.result.response)) {
      return next(new Error('Proxy to ' + proxyObj.reqOpts.url + ' failed for an unkown reason'));
    } else {
      proxyObj.res.status(proxyObj.result.response.statusCode || 400).send(proxyObj.result.body);
    }
  };
}

////////////////////////////////////////////////////////////
//
// Helpers
//
////////////////////////////////////////////////////////////

function proxyObjErrors (proxyObj) {
  if (!proxyObj) { return '`proxyObj` not defined'; }

  let errors   = '';
  let expected = ['req', 'req', 'reqOpts', 'options'];

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
