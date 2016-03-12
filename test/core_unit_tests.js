'use strict';

const superTest  = require('supertest');
const express    = require('express');
const bodyParser = require('body-parser');
const proxy      = require('../lib/proxy');
const mocha      = require('mocha');
const expect     = require('chai').expect;
const _          = require('lodash');
const URL        = require('url');
const QS         = require('qs');

// test configurations
const host        = 'api.github.com';
const prefix      = '/github';
const defaultPath = '/';
const ua          = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0';
const language    = 'en-US,en;q=0.8';


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
function testProxyConfig (options, finalCb) {
  // set up some defaults so we dont need to worry later
  options                     = options || {};
  options.request             = options.request || {};
  options.request.headers     = _.defaults({}, options.request.headers || {}, {Authorization: require('./github_auth_header')});
  options.request.query       = options.request.query || {};
  options.request.form        = options.request.form || {};
  options.request.method      = (options.request.method || 'GET').toLowerCase();
  options.config              = options.config || {};
  options.config.prefix       = options.config.prefix || '';
  options.config.log          = options.config.log || false;
  options.config.shortCircuit = options.config.shortCircuit === undefined ? true : options.config.shortCircuit;

  options.config.pre = options.config.pre || function (proxyObj, cb) {
    return options.result(proxyObj);
  };

  options.config.post = options.config.post || function (proxyObj, cb) {
    return options.result(proxyObj);
  };

  // build the server
  let server = express();
  server.use(bodyParser.json());
  server.use(proxy(host, options.config));

  // make a simple request to trigger pre requet middleware
  let testObj = superTest(server);

  // set the method and path
  testObj = testObj[options.request.method](options.config.prefix + (options.request.path || defaultPath) + '?' + QS.stringify(options.request.query));

  // set supertest request form
  if (options.request.method !== 'get') {
    testObj = testObj.send(options.request.form);
  }

  // set supertest request headers
  _.each(options.request.headers, function (value, key) {
    testObj = testObj.set(key, value);
  });

  testObj.end(finalCb);
}

// add string prototype to simplify url matching
String.prototype.toUrl = function () {
  return URL.parse(this.toString(), true);
};

////////////////////////////////////////////////////////////
//
// Unit tests
//
////////////////////////////////////////////////////////////

describe('Configuration Error Cases', function () {
  it('should Throw exception for non string host', function () {
    expect(() => proxy()).to.throw(Error);
    expect(() => proxy({})).to.throw(Error);
    expect(() => proxy([])).to.throw(Error);
    expect(() => proxy(null)).to.throw('proxy-express expects `host` to be a string');
  });
});

describe('Optional Proxy Configs', function () {
  it('should Throw exception for non string host', function () {
    expect(() => proxy('/test', 'test')).to.not.throw(Error);
    expect(() => proxy('/test', true)).to.not.throw(Error);
  });
});

describe('Core Unit Tests', function () {
  describe('Config Options', function () {
    // Prefix
    //
    describe('.prefix', function () {
      it('should set the prefix for the request', function (done) {
        testProxyConfig({
          config : { prefix : prefix },
          result : function testHook (proxyObj) {
            // make sure the result is the default path without the prefix
            let path = proxyObj.reqOpts.url.toUrl().pathname;
            expect(path).to.equal(defaultPath);
            return done();
          }
        });
      });
    });

    // Restrict
    //
    describe('.restrict', function () {
      function testRestrict (settings, callback) {
        let handledByProxy = false;
        testProxyConfig({
          request : {
            path : settings.path
          },
          config : {
            restrict : settings.restrict,
            post     : function (proxyObj, callback) { return callback(); },
            pre      : function (proxyObj, callback) {
              handledByProxy = true;
              return callback();
            }
          }
        }, function () {
          return callback(handledByProxy);
        });
      }

      describe('[String]', function () {
        it('should accept path containing substring', function (done) {
          testRestrict({
              path     : '/foo/bar/biz',
              restrict : 'bar'
          }, function (handledByProxy) {
            expect(handledByProxy).to.equal(true);
            return done();
          });
        });

        it('should reject path not containing substring', function (done) {
          testRestrict({
              path     : '/foo/biz',
              restrict : 'bar'
          }, function (handledByProxy) {
            expect(handledByProxy).to.equal(false);
            return done();
          });
        });
      });

      describe('[RegExp]', function () {
        it('should accept path matching regular expression', function (done) {
          testRestrict({
              path     : '/foo/bar/biz',
              restrict : /\/bar/
          }, function (handledByProxy) {
            expect(handledByProxy).to.equal(true);
            return done();
          });
        });

        it('should reject path not matching regular expression', function (done) {
          testRestrict({
              path     : '/foo/bar/biz',
              restrict : /^\/bar/
          }, function (handledByProxy) {
            expect(handledByProxy).to.equal(false);
            return done();
          });
        });
      });

      describe('[Array]', function () {
        it('should allow path with substring in restriction array', function (done) {
          testRestrict({
              path     : '/foo/bar/baz/biz',
              restrict : [
                'baz',
                /\/bar/
              ]
          }, function (handledByProxy) {
            expect(handledByProxy).to.equal(true);
            return done();
          });
        });

        it('should allow path with regex match in restriction array', function (done) {
          testRestrict({
              path     : '/foo/bar/biz',
              restrict : [
                'baz',
                /\/bar/
              ]
          }, function (handledByProxy) {
            expect(handledByProxy).to.equal(true);
            return done();
          });
        });

        it('should reject path without regex match or substring in restriction array', function (done) {
          testRestrict({
              path     : '/foobar/biz',
              restrict : [
                'baz',
                /\/bar/
              ]
          }, function (handledByProxy) {
            expect(handledByProxy).to.equal(false);
            return done();
          });
        });
      });
    });

    // request
    //
    describe('.request', function () {
      // Force Https
      //
      describe('.forceHttps', function () {
        it('should set the request protocol to https', function (done) {
          testProxyConfig({
            config : {
              request : {
                forceHttps : true
              }
            },
            result : function testHook (proxyObj) {
              // make sure the result is the default path without the prefix
              expect(proxyObj.reqOpts.url.toUrl().protocol).to.equal('https:');
              return done();
            }
          });
        });
      });

      // Prepend Request
      //
      describe('.prepend', function () {
        it('should prepend `/foo/bar/test` to the request', function (done) {
          let prepend = 'foo/bar/test';
          testProxyConfig({
            request : {
              path: '/biz'
            },
            config : {
              request : {
                prepend : prepend
              }
            },
            result : function testHook (proxyObj) {
              expect(proxyObj.reqOpts.url.toUrl().pathname).to.have.string(prepend);
              return done();
            }
          });
        });
      });

      // Follow Redirects
      //
      describe('.followRedirects', function () {
        it('should default to true', function (done) {
          testProxyConfig({
            result : function testHook (proxyObj) {
              expect(proxyObj.reqOpts.followAllRedirects).to.equal(true);
              return done();
            }
          });
        });

        it('should allow false', function (done) {
          testProxyConfig({
            config : {
              request : {
                followRedirects : false
              }
            },
            result : function testHook (proxyObj) {
              expect(proxyObj.reqOpts.followAllRedirects).to.equal(false);
              return done();
            }
          });
        });
      });

      // Request Headers
      //
      describe('.headers', function () {
        let overrideUa     = 'test';
        let requestHeaders = {
          'User-Agent'      : ua,
          'accept-language' : language
        };

        it('should override explicitly set headers', function (done) {
          testProxyConfig({
            request : {
              headers : requestHeaders
            },
            config : {
              request : {
                headers : {
                  'User-Agent' : overrideUa
                }
              }
            },
            result  : function testHook (proxyObj) {
              expect(proxyObj.reqOpts.headers['User-Agent']).to.equal(overrideUa);
              return done();
            }
          });
        });

        it('should leave unspecified headers intact', function (done) {
          testProxyConfig({
            request : {
              headers : requestHeaders
            },
            config : {
              request : {
                headers : {
                  'User-Agent' : overrideUa
                }
              }
            },
            result : function testHook (proxyObj) {
              expect(proxyObj.reqOpts.headers['accept-language']).to.equal(requestHeaders['accept-language']);
              return done();
            }
          });
        });
      });


      // Request Query
      //
      describe('.query', function () {
        let overrideQuery = { test: 'foo' };
        let requestQuery  = {
          test : 'bar',
          biz  : 'baz'
        };

        it('should override explicitly set query params', function (done) {
          testProxyConfig({
            request : {
              query : requestQuery
            },
            config : {
              request : {
                query : overrideQuery
              }
            },
            result  : function testHook (proxyObj) {
              expect(proxyObj.reqOpts.qs.test).to.equal(overrideQuery.test);
              return done();
            }
          });
        });

        it('should leave unspecified query params intact', function (done) {
          testProxyConfig({
            request : {
              query : requestQuery
            },
            config : {
              request : {
                query : overrideQuery
              }
            },
            result : function testHook (proxyObj) {
              expect(proxyObj.reqOpts.qs.biz).to.equal(requestQuery.biz);
              return done();
            }
          });
        });
      });

      // Request Form
      //
      describe('.form', function () {
        let overrideForm = { test: 'foo' };
        let requestForm  = {
          test : 'bar',
          biz  : 'baz'
        };

        it('should override explicitly set form properties', function (done) {
          testProxyConfig({
            request : {
              method : 'POST',
              form   : requestForm
            },
            config : {
              request : {
                form : overrideForm
              }
            },
            result  : function testHook (proxyObj) {
              expect(proxyObj.reqOpts.form.test).to.equal(overrideForm.test);
              return done();
            }
          });
        });

        it('should leave unspecified form properties intact', function (done) {
          testProxyConfig({
            request : {
              method : 'POST',
              form   : requestForm
            },
            config : {
              request : {
                form : overrideForm
              }
            },
            result : function testHook (proxyObj) {
              expect(proxyObj.reqOpts.form.biz).to.equal(requestForm.biz);
              return done();
            }
          });
        });
      });
    });

    // Pre
    //
    describe('.pre', function () {
      it('should accept a single functions', function (done) {
        let funcCount = 0;
        testProxyConfig({
          config : {
            pre : function (proxyObj, callback) {
              funcCount++;
              return callback();
            },
            post : function (proxyObj, callback) {
              expect(funcCount).to.equal(1);
              return done();
            }
          }
        });
      });

      it('should accept an array of functions', function (done) {
        let funcCount = 0;
        function funcStepper (proxyObj, callback) {
          funcCount++;
          return callback();
        }

        testProxyConfig({
          config : {
            pre : [
              funcStepper,
              funcStepper,
              funcStepper
            ],
            post : function (proxyObj, callback) {
              expect(funcCount).to.equal(3);
              return done();
            }
          }
        });
      });
    });

    // Post
    //
    describe('.post', function () {
      it('should accept a single function', function (done) {
        testProxyConfig({
          config : {
            pre : function (proxyObj, callback) { return callback(); },
            post : function (proxyObj, callback) {
              expect('function executed').to.ok();
              return done();
            }
          }
        });
      });

      it('should accept an array of functions', function (done) {
        let funcCount = 0;
        function funcStepper (proxyObj, callback) {
          funcCount++;
          return callback();
        }

        testProxyConfig({
          config : { pre : function (proxyObj, callback) { return callback(); },
            post : [
              funcStepper,
              funcStepper,
              funcStepper,
              function (proxyObj, callback) {
                expect(funcCount).to.equal(3);
                return done();
              }
            ]
          }
        });
      });
    });
  });
});
