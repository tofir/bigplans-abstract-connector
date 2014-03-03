'use strict';

var errors = require('../lib/errors');

describe('Errors', function() {
  function scopeError(name) {
    return new errors[name]();
  }

  describe('inheritance', function() {
    it('ConnectorError', function() {
      expect(scopeError('ConnectorError') instanceof Error).toBe(true);
    });

    it('AbstractConnectorError', function() {
      var error = scopeError('AbstractConnectorError');
      expect(error instanceof Error).toBe(true);
    });

    it('DispatcherError', function() {
      var error = scopeError('DispatcherError');
      expect(error instanceof Error).toBe(true);
    });

    it('ParamError', function() {
      var error = scopeError('ParamError');
      expect(error instanceof Error).toBe(true);
    });

    it('ValidatorError', function() {
      var error = scopeError('ValidatorError');
      expect(error instanceof Error).toBe(true);
    });

    it('ValidatorOptionError', function() {
      var error = scopeError('ValidatorOptionError');
      expect(error instanceof Error).toBe(true);
    });

    it('ValidationError', function() {
      var error = scopeError('ValidationError');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('params', function() {
    it('ParamError', function() {
      var error = new errors.ParamError('testParam', ['testParam']);
      expect(error.message).toMatch(/param: testParam,\nrequired params: \[ testParam \]/);
    });

    it('ValidatorOptionError', function() {
      var error = new errors.ValidatorOptionError('testOption');
      expect(error.message).toMatch('testOption is required to perform validation');
    });

    describe('ValidationError', function() {
      it('with simple output', function() {
        var error = new errors.ValidationError('testField');
        expect(error.message).toMatch('Field "testField" validation failed.');
      });

      it('with additional message', function() {
        var error = new errors.ValidationError('testField', 'some message');
        expect(error.message).toMatch('Field "testField" validation failed. some message');
      });
    });
  });
});
