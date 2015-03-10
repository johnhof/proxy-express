var superTest = require('supertest');
var request   = require('request');
var express   = require('express');
var proxy     = require('../lib/proxy');
var mocha     = require('mocha');
var expect    = require('chai').expect;
var async     = require('async');
var _         = require('lodash');
var URL       = require('url');

var protocol    = 'https';
var host        = 'api.github.com';
var prefix      = '/github';
var defaultPath = '/';
var ua          = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0';
var language    = 'en-US,en;q=0.8';


////////////////////////////////////////////////////////////
//
// Helpers
//
////////////////////////////////////////////////////////////

// hacky helper to let us test config settings without a ton of setup
//
// expect
// {
//   request : {}, // OPTIONAL - request overrides for the gefault GET `/`
//   config  : {}, // OPTIONAL - config settings for the proxy
//   result  : function (proxyObj) REQUIRED - callback to rest request object before it executes
// }
function testProxyConfig (options) {
  var proxyConfig = _.defaults(options.config || {}, {
    pre : function (proxyObj, cb) {
      return options.result(proxyObj);
    }
  });

  // build the server
  var server = express();
  proxyConfig.shortCircuit = true;
  server.use(proxy(host, proxyConfig));

  // make a simple request to trigger pre requet middleware
  var path  = (proxyConfig.prefix || '') + defaultPath;
  var testObj = superTest(server).get(path);

  // set supertestrequest headers
  _.each((options.request || {}).headers || {}, function (value, key) {
    testObj.set(key, value);
  })

  testObj.end();
}

//add string prototype to simplify url matching
String.prototype.toUrl = function () {
  return URL.parse(this.toString(), true);
}

////////////////////////////////////////////////////////////
//
// Unit tests
//
////////////////////////////////////////////////////////////


describe('Core Unit tests', function () {


  // Prefix
  //
  describe('prefix', function () {
    it('should set the prefix for the request', function (done) {
      testProxyConfig({
        config : { prefix : prefix },
        result : function prefixCheckHook (proxyObj) {
          // make sure the result is the default path without the prefix
          var path = proxyObj.reqOpts.url.toUrl().pathname;
          expect(path).to.equal(defaultPath);
          return done();
        }
      });
    });
  });


  // Force Https
  //
  describe('forceHttps', function () {
    it('should set the request protocol to https', function (done) {
      testProxyConfig({
        config : { forceHttps : true },
        result : function prefixCheckHook (proxyObj) {
          // make sure the result is the default path without the prefix
          expect(proxyObj.reqOpts.url.toUrl().protocol).to.equal('https:');
          return done();
        }
      });
    });
  });


  // Request Headers
  //
  describe('reqHeaders', function () {
    var overrideUa     = 'test';
    var requestHeaders = {
      'User-Agent'      : ua,
      'accept-language' : language
    };

    it('should override explicitly set headers', function (done) {
      testProxyConfig({
        request : {
          headers : requestHeaders
        },
        config : {
          reqHeaders : {
            'User-Agent' : overrideUa
          }
        },
        result  : function prefixCheckHook (proxyObj) {
          expect(proxyObj.reqOpts.headers['User-Agent']).to.equal(overrideUa);
          return done();
        }
      });
    });

    it('should leave unspecified herders intact', function (done) {
      testProxyConfig({
        request : {
          headers : requestHeaders
        },
        config : {
          reqHeaders : {
            'User-Agent' : overrideUa
          }
        },
        result : function prefixCheckHook (proxyObj) {
          expect(proxyObj.reqOpts.headers['accept-language']).to.equal(requestHeaders['accept-language']);
          return done();
        }
      });
    });
  });
});
