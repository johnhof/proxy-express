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

function gitReq (req, callback) {
  request({
    url    : ptotocol + '://' + host + req.path,
    method : req.method || 'GET',
  }, callback);
}

function requestAndCompare (server, req, done) {
  async.parallel({
    supertest: function (callback) {
      superTest(server).get(req.path).end(function (error, response) {
        return callback(error, response.body);
      });
    },

    request: function (callback) {
      gitReq(req, function (error, response, body) {
        return callback(error, body);
      });
    }

  }, function compare (error, results) {
    expect(error).to.not.exist();
    expect(results.request.body).to.equal(results.supertest.body)
    return done();
  });
}

////////////////////////////////////////////////////////////
//
// Tests
//
////////////////////////////////////////////////////////////

// describe('Core Integration Tests', function () {


//   // Config 1
//   //
//   describe('(1) Pure proxy', function () {
//     it('should match response from github', function (done) {
//       var server = express();
//       server.use(proxy(host, true));

//       requestAndCompare(server, { path: '/'}, function () {
//         return done();
//       });
//     });
//   });


//   // Config 2
//   //
//   describe('(2) Proxy with prefix', function () {
//     it('should match response from github', function (done) {
//       var server = express();
//       server.use(proxy(host, '/github', true));

//       requestAndCompare(server, { path: '/github'}, done);
//     });
//   });


//   // Config 3
//   //
//   describe('(3) Complex proxy', function () {
//     it('should match response from github', function (done) {
//       var server = express();
//       server.use(proxy(host, {
//         forceHttps : true,
//         prefix     : 'github',
//         reqHeaders : {
//           'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
//         }
//       }));

//       requestAndCompare(server, { path: '/github'}, done);
//     });
//   });
// });
