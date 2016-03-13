'use strict';

const helpers = require('../lib/helpers');
const mocha   = require('mocha');
const expect  = require('chai').expect;
const _       = require('lodash');

////////////////////////////////////////////////////////////
//
// Unit tests
//
////////////////////////////////////////////////////////////

describe('Helpers Unit Tests', function () {

  // Default Headers
  //
  describe('defaultHeaders', function () {
    let success = 'OK';
    let result  = helpers.defaultHeaders({
      foo : success,
      bar : undefined,
      bad : null
    }, {
      foo : 'Should be overridden',
      baz : success,
      bar : 'Should be deleted'
    });

    it('should override existing headers', function () {
      expect(result.foo).to.equal(success);
    });

    it('should preserve headers not explicitly overridden', function () {
      expect(result.baz).to.equal(success);
    });

    it('should should delete headers overridden with non string headers', function () {
      expect(result).to.not.have.property('bad');
    });

    it('should should delete headers overridden with undefined', function () {
      expect(result).to.not.have.property('bar');
    });
  });

  // Matches Restriction
  //
  describe('matchesRestriction', function () {
    let regExp = /.+\/bar/;
    let string = 'foo';

    it('should return true for path matching regex', function () {
      expect(helpers.matchesRestriction({url: '/foo/bar'}, regExp)).to.equal(true);
    });

    it('should return false for path failing to match regexp', function () {
      expect(helpers.matchesRestriction({url: '/bar/foo'}, regExp)).to.equal(false);
    });

    it('should return true for path containing string', function () {
      expect(helpers.matchesRestriction({url: '/foo/bar'}, string)).to.equal(true);
    });

    it('should return false for path containing string', function () {
      expect(helpers.matchesRestriction({url: '/bar/biz'}, string)).to.equal(false);
    });

    it('should return null for invalid filter', function () {
      expect(helpers.matchesRestriction({url: '/bar/biz'}, null)).to.equal(null);
    });

    describe('with a filter function', function () {
      describe('returning boolean', function () {
        it('should return false for a function that returns false', function () {
          expect(helpers.matchesRestriction({url: '/bar/biz'}, () => false)).to.equal(false);
        });

        it('should return true for a function that returns true', function () {
          expect(helpers.matchesRestriction({url: '/bar/biz'}, () => true)).to.equal(true);
        });
      });

      describe('returning a string', function () {
        it('should return true for a path containing a string', function () {
          expect(helpers.matchesRestriction({url: '/foo/bar'}, () => string)).to.equal(true);
        });

        it('should return false for a path containing string', function () {
          expect(helpers.matchesRestriction({url: '/bar/biz'}, () => string)).to.equal(false);
        });
      });

      describe('returning a regexp', function () {
        it('should return true for path matching regex', function () {
          expect(helpers.matchesRestriction({url: '/foo/bar'}, () => regExp)).to.equal(true);
        });

        it('should return false for path failing to match regexp', function () {
          expect(helpers.matchesRestriction({url: '/bar/foo'}, () => regExp)).to.equal(false);
        });
      });

      describe('returning a function', function () {
        describe('returning boolean', function () {
          it('should return false for a function that returns false', function () {
            expect(helpers.matchesRestriction({url: '/bar/biz'}, () => _.constant(false))).to.equal(false);
          });

          it('should return true for a function that returns true', function () {
            expect(helpers.matchesRestriction({url: '/bar/biz'}, () => _.constant(true))).to.equal(true);
          });
        });
      });

      describe('with an array', function () {
        it('should return false if all array values return false', function () {
          expect(helpers.matchesRestriction({url: '/bar/biz'}, [
            regExp,
            string,
            false,
            () => _.constant(false)
          ])).to.equal(false);
        });

        it('should return true if one array value returns true', function () {
          expect(helpers.matchesRestriction({url: '/bar/biz'}, [
            regExp,
            string,
            false,
            () => _.constant(true)
          ])).to.equal(true);
        });
      });
    });

    describe('Testing Option building', function () {
      it('Should create proper objects', function () {
        let stringOption = helpers.buildOptions('test');
        expect(stringOption.prefix).to.equal('test');
        let regExOption = helpers.buildOptions(new RegExp('test'));
        expect(regExOption.restrict.match.test('test')).to.equal(true);
        let objectOption = helpers.buildOptions({test: 'test'});
        expect(objectOption.test).to.equal('test');
      });
    });
  });
});
