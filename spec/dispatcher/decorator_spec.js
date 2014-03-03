'use strict';

var Decorator = require('../../lib/dispatcher/decorator');

describe('Decorator', function() {
  // function toJsend(result, apiRes) {
  describe('toJesend', function() {
    var dataResponse;
    var apiRes;
    beforeEach(function() {
      dataResponse  = { item: { name: 'value'} };
      apiRes        = { statusCode: 200 };
    });

    it('renders success message', function() {
      expect(Decorator.toJsend(dataResponse, apiRes)).toEqual({
        status: 'success',
        data: dataResponse,
        message: ''
      });
    });

    it('renders error message', function() {
      var error = new Error('test error');
      expect(Decorator.toJsend(error)).toEqual({
        status: 'error',
        data: {},
        message: 'test error'
      });
    });

    describe('unknown error', function() {
      it('renders "unknown error"', function() {
        apiRes.statusCode = 401;
        dataResponse = null;
        expect(Decorator.toJsend(dataResponse, apiRes)).toEqual({
          status: 'fail',
          data: {},
          message: 'unknown error'
        });
      });

      it('renders provider error', function() {
        apiRes.statusCode = 401;
        dataResponse = 'provider custom error';
        expect(Decorator.toJsend(dataResponse, apiRes)).toEqual({
          status: 'fail',
          data: {},
          message: dataResponse
        });
      });
    });
  });
});
