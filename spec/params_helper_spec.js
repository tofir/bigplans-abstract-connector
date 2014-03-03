'use strict';

var ParamsHelper = require('../lib/params_helper');
var errors = require('../lib/errors');

describe('ParamsHelper', function() {
  var route;
  var req;
  var reqParams;

  var data;
  var paramsHelper;

  beforeEach(function() {
    reqParams = {};
    data = {};

    route = { path: '', data: {} };
    req = { param: getParam };

    paramsHelper = new ParamsHelper('http://test.tld/');
  });

  function getParam(name) {
    return reqParams[name];
  }

  function getRequestData() {
    data = paramsHelper.getRequestData(route, req);
  }


  describe('constructor', function() {
    it('removes trailing slashes', function() {
      paramsHelper = new ParamsHelper('http://test.one.tld///');
      expect(paramsHelper.getBaseUrl()).toEqual('http://test.one.tld');
    });


    it('works correctly with no trailing slash', function() {
      paramsHelper = new ParamsHelper('http://test.two.tld');
      expect(paramsHelper.getBaseUrl()).toEqual('http://test.two.tld');
    });
  });

  describe('bodyExpected', function() {
    it('expects request BODY', function() {
      ['put', 'post'].forEach(function(verb) {
        expect(paramsHelper.bodyExpected(verb)).toEqual(true);
      });
    });


    it('does not expect request BODY', function() {
      expect(paramsHelper.bodyExpected('get')).toEqual(false);
    });
  });


  describe('fetch params form request', function() {
    var allParams;

    beforeEach(function() {
      reqParams.paramOne    = 'one';
      reqParams.paramTwo    = 'two';
      reqParams.paramThree  = 'three';
      reqParams.paramFour   = 4;

      route.path = '%{paramOne}/%{paramTwo}';
      route.data = {paramThree: false, paramFour: 'four'};

      allParams = Object.keys(reqParams);
    });


    it('removes trailing slashes from route.path', function() {
      route.path = '///one';
      getRequestData();
      expect(data.uri).toEqual('http://test.tld/one');
      expect(data.body).not.toBeDefined();
    });


    it('fetches data params from the request', function() {
      route.method = 'put';
      getRequestData();
      expect(data.uri).toEqual('http://test.tld/one/two');
      expect(data.body).toEqual({ paramThree: 'three', four: 4 });
    });


    describe('fails', function() {
      function expectingParamError(name) {
        var error = new errors.ParamError(name, allParams);
        expect(getRequestData).toThrow(error);
      }


      it('triggers error on query string params absense', function() {
        delete reqParams.paramTwo;
        expectingParamError('paramTwo');
      });


      it('triggers error on body params absense', function() {
        delete reqParams.paramThree;
        expectingParamError('paramThree');
      });
    });
  });
});
