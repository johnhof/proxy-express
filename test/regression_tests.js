'use strict';

const superTest  = require('supertest');
const express    = require('express');
const proxy      = require('../lib/proxy');
const mocha      = require('mocha');
const expect     = require('chai').expect;

////////////////////////////////////////////////////////////
//
// Regression tests
//
////////////////////////////////////////////////////////////


describe('Regression Tests', function () {
  describe('Status Code', function () {
    it('should properly proxy non 200 responses', function (done) {
      let server = express();

      server.use(proxy('api.github.com', {
        prefix  : 'github',
        request : {
          forceHttps : true,
          strictSSL  : false,
          headers    : {
            'User-Agent' : 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36',
            'host' : 'api.github.com',
            Authorization : require('./github_auth_header')
          }
        }
      }));

      superTest(server).get('/github/four/oh/four').expect(404).end(done);
    });
  });
});
