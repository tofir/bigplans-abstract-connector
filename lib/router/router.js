'use strict';

var Route = require('./route');

// private variables
// Route Objects collection
var routes = {};

function isValidName(name) {
  // jshint -W052
  return ~Route.KNOWN_ROUTES.indexOf(name);
}

function getRoute(name) {
  return routes[name] || new Route(name);
}

function Router() {
  routes = {};
}

/**
* Usage example:
* router.addRoute('getGoal', {
*   path: '/%{projectName}/%{userName}/issues/%{ussueId}?acccess_token=%{accessToken}',
*   *** DEFAULTS ****
*   method: 'get'
*   hooks: [],
*   handler: function(data, apiRes, done) { done(JSON.parse(data || apiRes.body)); }
* });
*
* NOTES: data can be passed further via 'this': this.myLocaVar = myData
**/
Router.prototype.addRoute = function(name, options) {
  if(!isValidName(name)) { return false; }
  var route = getRoute(name);
  route.append(options);
  routes[name] = route;

  return true;
};

/**
* Usage example:
* router.addHook('getGoal', function(req, res, done) { this.objectName = 'some data'; });
*
* NOTES:
* # callbacks will be executed in the same order they where added
* # data can be passed further via 'this': this.myLocaVar = myData
**/
Router.prototype.addHook = function(name, hook) {
  if(!isValidName(name)) { return false; }
  var route = getRoute(name);
  routes[name] = route;

  if(typeof hook !== 'function') {
    return false;
  }

  route.hooks.push(hook);

  return true;
};

Router.prototype.getRoutes = function() {
  var list = {};
  Route.KNOWN_ROUTES.forEach(function(name) {
    list[name] = routes[name];
  });

  return list;
};

module.exports = Router;
