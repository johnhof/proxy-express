var helpers = require('../lib/helpers');
var mocha   = require('mocha');
var expect  = require('chai').expect;


////////////////////////////////////////////////////////////
//
// Unit tests
//
////////////////////////////////////////////////////////////


describe('Unit Helpers Tests', function () {

  // Default Headers
  //
  describe('defaultHeaders', function () {
    var success = 'OK';
    var result  = helpers.defaultHeaders({
      foo : success,
      bar : undefined
    }, {
      foo : 'Should be overridden',
      baz : success,
      bar : 'Should be deleted'
    });

    it('should override existing headers', function () {
      expect(result.foo).to.equal(success)
    })

    it('should preserve headers not explicitly overridden', function () {
      expect(result.baz).to.equal(success)
    });

    it('should should delete headers overridden with undefined', function () {
      expect(result).to.not.have.property('bar')
    });

  });
});