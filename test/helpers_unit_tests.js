var helpers = require('../lib/helpers');
var mocha   = require('mocha');
var expect  = require('chai').expect;


////////////////////////////////////////////////////////////
//
// Unit tests
//
////////////////////////////////////////////////////////////


describe('Helpers Unit Tests', function () {

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

  // Matches Restriction
  //
  describe('matchesRestriction', function () {
    var regExp = /.+\/bar/
    var string = 'foo'

    it('should return true for path matching regex', function () {
      expect(helpers.matchesRestriction('/foo/bar', regExp)).to.equal(true);
    });

    it('should return false for path failing to match regexp', function () {
      expect(helpers.matchesRestriction('/bar/foo', regExp)).to.equal(false);
    });

    it('should return true for path containing string', function () {
      expect(helpers.matchesRestriction('/foo/bar', string)).to.equal(true);
    });

    it('should return false for path containing string', function () {
      expect(helpers.matchesRestriction('/bar/biz', string)).to.equal(false);
    });
  });
});