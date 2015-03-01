var superTest = require('supertest');
var request   = require('request');
var express   = require('express');
var proxy     = require('../lib/proxy');
var mocha     = require('mocha');
var expect    = require('chai').expect;
var async     = require('async');
var _         = require('lodash');

var ptotocol    = 'https';
var host        = 'api.github.com';
var prefix      = '/github';
var defaultPath = '/';
var ua          = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0';


////////////////////////////////////////////////////////////
//
// Helpers
//
////////////////////////////////////////////////////////////

function testProxyConfig (config, callback) {
  var baseConfig = {
    headers : { 'User-Agent' : ua },
    digest  : {
      pre : function (proxyObj, cb) {
        console.log('ahhhhhhhhhhh')
        return callback(null, proxyObj);
      }
    }
  };

  var proxyOpts = _.defaults(config, baseConfig);

  // build the server
  var server = express();
  server.use(proxy(host, proxyOpts));

  // make a simple request to trigger pre requet middleware
  superTest(server).get(baseConfig.prefix + defaultPath).end();
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
        prefix : prefix
      }, function prefixCheckHook (proxyObj) {
        console.log(proxyObj);
        expect(proxyObj.reqOpts.path).to.equal(defaultPath);
        done();
      });
    });
  });
});