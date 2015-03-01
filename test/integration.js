var superTest = require('supertest');
var request   = require('request');
var express   = require('express');
var proxy     = require('../lib/proxy');
var mocha     = require('mocha');
var expect    = require('chai').expect;
var async     = require('async');
var _         = require('lodash');

var ptotocol = 'https';
var host     = 'api.github.com';

////////////////////////////////////////////////////////////
//
// Helpers
//
////////////////////////////////////////////////////////////

function gitReq (reqOpts, callback) {
  var path = (!reqOpts.path.indexOf('/') ? reqOpts.path : '/' + reqOpts.path);

  request(_.defaults(reqOpts, {
    url    : ptotocol + '://' + host + path,
    method : reqOpts.method || 'GET',
  }), callback);
}

function requestAndCompare (server, req, callback) {
  var results = {};

  async.parallel([
    function superTestReq (callback) {
      var prefix = '';
      if (req.prefix) {
        prefix = ((req.prefix.indexOf('/') === -1) ? req.prefix : '/' + req.prefix);
      }

      superTest(server).get(prefix + req.path).end(function (error, res) {
        if (error) { throw error; }
        results.superTest = res;
        return callback();
      });
    },

    function testReq (callback) {
      results.request = gitReq(req, function (error, response, body) {
        results.trueResult = {
          response : response,
          body     : body
        }
        return callback();
      });
    }

  ], function compare () {
      console.log('test')
      console.log(results.trueResult.body)
      console.log(results.superTest.body)
      expect(results.trueResult.body).to.equal(results.superTest.body)
      return callback();
  });
}

////////////////////////////////////////////////////////////
//
// Tests
//
////////////////////////////////////////////////////////////

describe('Integration Test', function () {


  // Config 1
  //
  describe('(1) Pure proxy', function () {
    it('should match response from github', function (done) {
      var server = express();
      server.use(proxy(host, true));

      requestAndCompare(server, { path : '/' }, function () {
        // server.close();
        return done();
      });
    });
  });


  // // Config 2
  // //
  // describe('(2) Proxy with prefix', function () {
  //   it('should match response from github', function (done) {
  //     var server = express();
  //     server.use(proxy(host, '/github', true));

  //     requestAndCompare(server, { path : '/', prefix : '/github' }, done);
  //   });
  // });


  // // Config 3
  // //
  // describe('(3) Complex proxy', function () {
  //   it('should match response from github', function (done) {
  //     var server = express();
  //     server.use(proxy(host, {
  //       forceHttps : true,
  //       prefix     : 'github',
  //       headers    : {
  //         'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
  //       }
  //     }));

  //     requestAndCompare(server, { path : '/' }, done);
  //   });
  // });
});
