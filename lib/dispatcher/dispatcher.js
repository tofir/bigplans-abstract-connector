'use strict';

var http = require('request');

var DataContainer = require('./data_container');
var Decorator = require('./decorator');

// private variables
var translator;
var paramsHelper;


/* TRANSLATIONS AND PREPARE TO RESPOND */
function translateBodyData(action, data) {
  Object.keys(data).forEach(function(name) {
    var local = data[name];

    if(typeof local !== 'object') { return; } // skip strings, affect only objects
    var translated = translator.translate(action, 'fromLocal', local);
    data[name] = translated.data;
  });

  return data;
}


function translateResponse(route, data) {
  // skip strings, affect only objects
  if(typeof data !== 'object') { return data; }

  var bodySent = paramsHelper.bodyExpected(route.method);
  if(bodySent) { return data; } // no need to translate, if PUT or POST request performed

  var translation = translator.translate(route.name, 'toLocal', data);
  var result = {};
  result[translation.meta] = translation.data;

  return result;
}


function xhrOptions(route, req) {
  var data = paramsHelper.getRequestData(route, req);
  var options = {
    uri:      data.uri,
    method:   route.method,
    body:     {},
    headers:  route.headers,
    json:     true
  };

  if(data.body) { // only translate, when PUT or POST request performed
    options.body = translateBodyData(route.name, data.body);
  }

  return options;
}

function initContainerHook(dataContainer) {
  return function(req, res, next) {
    dataContainer.setData();
    next();
  };
}
/* TRANSLATIONS AND PREPARE TO RESPOND END */


/* HANDLE REQUEST-RESPONSE METHODS */
function closeByTimeout(res, done) {
  setTimeout(function() {
    if(!res.finished) { done(); }
  }, 5000);
}

/**
* wrapper for the beforeFilter hooks
**/
function middlwareHandler(dataContainer, callback) {
  return function(req, res, next) {
    var container = dataContainer.getData();
    var hook = callback.bind(container);

    // express server will stuck
    // if "next" is omitted in the hook
    // break on 5sec timeout:
    closeByTimeout(res, next);
    return hook(req, res, next);
  };
}

/**
* wrapper around the user-defined callback
**/
function externalApiHandler(dataContainer, apiRes, routeHandler) {
  return function(data, done) {
    var container = dataContainer.getData();
    var handler = routeHandler.bind(container);

    if(handler.length > 2) {
      return handler(data, apiRes, done);
    } else if (handler.length === 2) {
      return handler(data, done);
    }

    handler(data);
    done(data);
  };
}

/**
* returned function will trigger when "done(data || res.data)" is called
* basically, it's DONE in the user-defined handler
**/
function responseDataHandler(route, res, apiRes) {
  return function(data) {
    data = translateResponse(route, data);
    data = Decorator.toJsend(data, apiRes);
    res.json(data);
  };
}

function handleError(err, res) {
  var data = Decorator.toJsend(err);
  res.json(data);
}
/* HANDLE REQUEST-RESPONSE METHODS END */


/* MAIN FUNCTIONALITY */

/**
* Usage:
* === Connector scope ===
*
* var paramsHelper = new ParamsHelper(this.baseUrl);
*
* var dispatcher = new Dispatcher({
*   paramsHelper: paramsHelper,
*   translator: this.translator
* });
*
* routes.forEach(function(route) {
*   configured = dispatcher.use(route);
*
*   var beforeHooks = configured.beforeHooks();
*   var action      = configured.action();
*
*   var serve       = server[route.method];
*
*   serve(endpoint, beforeHooks, action);
* });
**/
function Dispatcher(options) {
  translator    = options.translator;
  paramsHelper  = options.paramsHelper;
}


/**
* Armed with route instance
**/
Dispatcher.prototype.use = function(route) {
  var dataContainer = new DataContainer({
    http: http,
    baseUrl: paramsHelper.getBaseUrl()
  });

  return {
    // external request builder
    action: function () {
      return function(req, res) {
        var xhrOpts = xhrOptions(route, req);
        var method = xhrOpts.method;
        delete xhrOpts.method;
        // debug: forwarding HTTP <method> to <xhrOpts>

        // trigger external Request
        http[method](xhrOpts, function(err, apiRes, body) {
          // may put express.js down on ECONNREFUSED
          if(err) { return handleError(err, res); }

          var handle  = externalApiHandler(dataContainer, apiRes, route.handler);
          var done    = responseDataHandler(route, res, apiRes);

          // ensure that session was closed:
          closeByTimeout(res, done);
          // handle the response
          handle(body, done);
        });
      };
    },

    beforeHooks: function() {
      var hooks = [];
      hooks.push(initContainerHook(dataContainer));

      route.hooks.forEach(function(hook) {
        var handler = middlwareHandler(dataContainer, hook);
        hooks.push(handler);
      });

      return hooks;
    }
  };
};

module.exports = Dispatcher;
