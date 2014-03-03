'use strict';

var util = require('util');
var sinon = require('sinon');
require('jasmine-sinon');

var AbstractConnector = require('../main');
var errors = require('../lib/errors');

describe('AbstractConnector', function() {
  var connector;

  var router;
  var translator;
  var server;

  var connectorBaseUrl;

  // test entities to replace existing instances
  function ConnectorTest(options) {
    this.baseUrl  = connectorBaseUrl;
    this.name     = 'test';

    this.router     = router ;
    this.translator = translator;

    AbstractConnector.call(this, options);
  }
  util.inherits(ConnectorTest, AbstractConnector);
  // test entities to replace existing instances END

  function initConnector() {
    connector = new ConnectorTest({server: server});
  }

  function validationError(name, message) {
    return new errors.ValidationError(name, message);
  }

  beforeEach(function() {
    server      = sinon.stub();
    translator  = sinon.stub();
    router      = { getRoutes: sinon.stub() };
    router.getRoutes.returns({
      getGoal: {
        hooks: [],
        action: 'action'
      }
    });

    connectorBaseUrl  = 'http://test.tld';
  });


  describe('validation', function() {
    it('complaints on missing baseUrl', function() {
      var error = validationError('baseUrl', 'Connector.baseUrl is required');
      connectorBaseUrl = null;

      expect(function() { initConnector(); }).toThrow(error);
    });


    it('complaints on missing server', function() {
      var error = validationError('server', 'express.js app server instance is required in constructor options');
      expect(function() { connector = new ConnectorTest(); }).toThrow(error);
    });


    it('complaints on missing router', function() {
      router = null;
      var error = validationError('router',
        'Router instance is required. Please add "this.router = router" in the constructor.');
      expect(function() { initConnector(); }).toThrow(error);
    });


    it('complaints on non-translator instance', function() {
      var error = validationError('translator',
        'Translator instance is required. Please add "this.translator = translator" in the constructor.');
      translator = null;
      expect(function() { initConnector(); }).toThrow(error);
    });


    it('passes validation', function() {
      expect(function() { initConnector(); }).not.toThrow();
    });
  });

  describe('get', function() {
    beforeEach(function() { initConnector(); });

    it('returns existing item', function() {
      expect(connector.get('router')).toEqual(router);
    });
  });

  describe('applyRoute', function() {
    beforeEach(function() {
      initConnector();
      server.get = jasmine.createSpy('server.get');
    });


    it('validates endpoint', function() {
      expect(function() {
        connector.applyRoute('getGoal', {});
      }).toThrow(new errors.AbstractConnectorError('endpoint is required'));
    });


    it('validates listener', function() {
      expect(function() {
        connector.applyRoute('getGoal', { endpoint: 'test', method: 'delete' });
      }).toThrow(new errors.AbstractConnectorError('Counld not apply HTTP VERB delete'));
    });


    it('applies route successfully', function() {
      expect(function() {
        connector.applyRoute('getGoal', { endpoint: 'test' });
      }).not.toThrow();
    });


    it('executes valid call chain', function() {
      connector.applyRoute('getGoal', { endpoint: 'test' });
      expect(server.get).toHaveBeenCalledWith('test', jasmine.any(Function), jasmine.any(Function));
    });
  });
});
