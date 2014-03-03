'use strict';

var errors        = require('./lib/errors');
var Dispatcher    = require('./lib/dispatcher');
var Validator     = require('./lib/validator');
var ParamsHelper  = require('./lib/params_helper');

var AbstractConnectorError = errors.AbstractConnectorError;

// private variables
var self = {};

function validate(data) {
  new Validator(data)
    .add('baseUrl', {
      presence: true,
      type: 'string',
      message: 'Connector.baseUrl is required'
    })
    .add('server', {
      presence: true,
      message: 'express.js app server instance is required in constructor options'
    })
    .add('router', {
      presence: true,
      message: 'Router instance is required. Please add "this.router = router" in the constructor.'
    })
    .add('translator', {
      presence: true,
      message: 'Translator instance is required. Please add "this.translator = translator" in the constructor.'
    })
    .checkAll();
}


function initOptions(container, options) {
  self.baseUrl    = container.baseUrl;
  self.server     = options.server;
  self.router     = container.router;
  self.translator = container.translator;
}

/**
* main constructor
**/
function AbstractConnector(options) {
  self    = {};
  options = options || {};

  initOptions(this, options);
  validate(self);

  var paramsHelper = new ParamsHelper(this.baseUrl);
  self.dispatcher = new Dispatcher({
    paramsHelper: paramsHelper,
    translator: self.translator
  });

  self.routes = self.router.getRoutes();
}

function getListener(method) {
  var listen;
  try {
    listen = self.server[method].bind(self.server);
  } catch(e) {
    throw new AbstractConnectorError('Counld not apply HTTP VERB ' + method);
  }

  return listen;
}

AbstractConnector.prototype.get = function(objectName) {
  return self[objectName];
};

/**
* Usage example:
* var connector = new Connector({server: app});
*
* connector.applyRoute('getUsers', {
*   endpoint: '/' + connector.name + '/users',
*   ***** DEFAULT method is GET *****
*   method: 'get'
* });
**/
AbstractConnector.prototype.applyRoute = function(name, options) {
  var endpoint  = options.endpoint;
  var method    = options.method || 'get';
  method        = method.toLowerCase();
  var listen    = getListener(method);

  if(!endpoint) { throw new AbstractConnectorError('endpoint is required'); }

  var route = self.routes[name];
  var configured  = self.dispatcher.use(route);

  var hooks   = configured.beforeHooks();
  var action  = configured.action();

  // first argument is an endpoint
  hooks.unshift(endpoint);
  // final is action itself
  hooks.push(action);
  // server.get(endpoint, hook1, hook2, hook3, action);
  listen.apply(listen, hooks);

  return this;
};

module.exports = AbstractConnector;
