'use strict';

var Validator = require('../validator');
var KNOWN_ROUTES = ['getUsers', 'getProjects', 'getGoal', 'getGoals', 'createGoal', 'updateGoal'];


function defaultHandler(data, res, done) {
  return done(data || res.body);
}

function toRouteOptions(container, options) { // jshint -W074
  options         = options || {};
  options.name    = container.name;

  options.method  = options.method  || container.method;
  options.method  = options.method.toString().toLowerCase();

  options.data    = options.data    || container.data;
  options.handler = options.handler || defaultHandler;
  options.hooks   = options.hooks   || container.hooks;
  options.headers = options.headers || container.headers;

  return options;
}


/* PARAMS VALIDATION */
function hooksValidator(route) {
  var hooks = route.hooks;
  if(!Array.isArray(hooks)) { return false; }

  for(var i = 0; i < hooks.length; i++) {
    var hook = hooks[i];
    if(typeof hook !== 'function') { return false; }
  }

  return true;
}

function validate(fields) {
  new Validator(fields)
    .add('name', {
      presence: true,
      existsIn: KNOWN_ROUTES,
      message: 'Route NAME should be one of: ' + KNOWN_ROUTES.join(', ')
    })
    .add('path', {
      presence: true,
      type: 'string',
      message: 'API PATH is required'
    })
    .add('handler', {
      type: 'function',
      message: 'HANDLER "function(data, apiRes, next) { next({}) }" is required'
    })
    .add('hooks', {
      expression: hooksValidator,
      message: 'HOOK must represent a valid callback "function(req, res, next) { }"'
    })
    .checkAll();
}
/* PARAMS VALIDATION END */



function Route(name) {
  // defaults
  this.name     = name;
  this.method   = 'get';
  this.data     = {};
  this.hooks    = [];
  this.headers  = {};
}

Route.prototype.append = function(data) {
  data = toRouteOptions(this, data);
  validate(data);

  for(var key in data) {
    this[key] = data[key];
  }
};

module.exports = Route;
module.exports.KNOWN_ROUTES = KNOWN_ROUTES;
