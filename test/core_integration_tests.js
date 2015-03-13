var superTest  = require('supertest');
var express    = require('express');
var proxy      = require('../lib/proxy');
var mocha      = require('mocha');
var expect     = require('chai').expect;

////////////////////////////////////////////////////////////
//
// Integration tests
//
////////////////////////////////////////////////////////////


describe('Core Integration tests', function () {
  describe('Smoke test', function () {
    it('should make a basic request to github', function (done) {
      server = express();

      server.use(proxy('api.github.com', {
        prefix  : 'github',
        request : {
          forceHttps : true,
          headers    : {
            'User-Agent' : 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36',
          }
        }
      }));

      superTest(server).get('/github').expect(200).end(done);
    })
  });
});
