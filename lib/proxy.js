var request = require('request');
var _       = require('lodash');
var URL     = require('url');
var sync    = require('async');

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
      filter : {
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
function buildStream (host, options) {

  var stream = [reqPrimer(host, options)];

  options.digest = options.digest  || {};

  // if there is `pre` middleware
  if (options.digest && options.digest.pre) {
    _.each(options.digest.pre || [], function (middleware) {
      if (typeof middleware === 'function ') { stream.push(middleware); }
    });
  }

  // push the core request
  stream.push(proxyReq);

  // if there is `post` middleware
  if (options.digest && options.digest.post) {
    _.each(options.digest.post || [], function (middleware) {
      if (typeof middleware === 'function ') { stream.push(middleware); }
    });
  }

  return stream;
}

////////////////////////////////////////////////////////////
//
// Resulting middleware
//
////////////////////////////////////////////////////////////

function buildResultingMiddleware (host, options, stream) {
  return function (req, res, next) {
    var requestedUrl = URL.parse(res.url);

    // make sure the current request is greenlit
    var greenlit = true;

    // check for the prefix
    if (typeof options.prefix) === 'string') {
      var prefix = options.prefix[0] == '/' ? options.prefix : '/' + options.prefix;
    }



    stream.unshift(function (callback) {
      var reqOpts = {
        url :
      };

      return callback(null, {
        req     : req,
        req     : res,
        reqOpts : reqOpts
      });
    });

    return async.waterfall(stream, respond);
  }
}


////////////////////////////////////////////////////////////
//
// Stream functions
//
////////////////////////////////////////////////////////////

//
// async function to make the proxied request
//
function proxyReq (proxyObj, callback) {
  var req = proxyObj.req;

  request({
    url : req.uri
  }, function (error, response, body) {
    proxyObj.result = {
      response : response,
      body     : body
    };

    return callback(error, proxyObj)
  });
}

//
// make the request
//
function respond (next) {
  function (error, proxyObj) {
    if (error) {
      return next(error);

    } else if (!proxyObj.reponse) {
      return next(new Error('Failed to get a response from the proxied request'));

    } else {

      // TODO: translate the reponse to the res object to send

      proxyObj.send(proxyObj.reponse.body);
    }
  }
}