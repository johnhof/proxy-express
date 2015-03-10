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


////////////////////////////////////////////////////////////
//
// Helpers
//
////////////////////////////////////////////////////////////

// hacky helper to let us test config settings without a ton of setup
function testProxyConfig (options) {
  var proxyConfig = _.defaults(options.config, {
    headers : { 'User-Agent' : ua },
    pre : function (proxyObj, cb) {
      return options.result(proxyObj);
    }
  });

  // build the server
  var server = express();
  proxyConfig.shortCircuit = true;
  server.use(proxy(host, proxyConfig));

  // make a simple request to trigger pre requet middleware
  var path = (proxyConfig.prefix || '') + defaultPath;
  superTest(server).get(path).end();
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


describe('Unit test', function () {


  // Prefix
  //
  describe('Prefix', function () {
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
  describe('Force Https', function () {
    it('should set the request protocol to https', function (done) {
      testProxyConfig({
        config : { forceHttps : true },
        result : function prefixCheckHook (proxyObj) {
          // make sure the result is the default path without the prefix
          expect(proxyObj.reqOpts.url.toUrl().protocol).to.equal('https:');
          done();
        }
      });
    });
  });
});
