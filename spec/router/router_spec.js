'use strict';

var Router = require('../../lib/router');
var Route = require('../../lib/router/route');

/*


Router.prototype.getRoutes = function() {
  var list = {};
  Route.KNOWN_ROUTES.forEach(function(name) {
    list[name] = self.routes[name];
  });

  return list;
};
*/
describe('Router', function() {
  var router;
  var data;
  beforeEach(function() {
    router = new Router();
    data = {
      path: 'issues/%{userId}',
      handler: function() {},
      hooks: [ function() {} ]
    };
  });


  describe('constructor', function() {
    it('assigns default data', function() {
      var routes = router.getRoutes();
      expect(routes).toBeDefined();

      [ 'getUsers',
        'getProjects',
        'getGoal',
        'getGoals',
        'createGoal',
        'updateGoal'].map(function(name) {

        expect(routes.hasOwnProperty(name)).toBe(true);
        expect(routes[name]).not.toBeDefined();
      });
    });
  });


  describe('addRoute', function() {
    it('assigns route data', function() {
      expect(function() {
        router.addRoute('getGoal', data);
      }).not.toThrow();

      var routes = router.getRoutes();
      expect(routes.getGoal.handler).toEqual(data.handler);
    });


    it('skips adding for route with invalid name', function() {
      expect(router.addRoute('invalidName', data)).toBe(false);
    });
  });


  describe('addHook', function() {
    it('assigns route data', function() {
      var hook = function() { return null; };
      expect(router.addHook('getGoal', hook)).toBe(true);

      var routes = router.getRoutes();
      expect(routes.getGoal.hooks).toContain(hook);
    });


    it('adds route prior to add a hook', function() {
      expect(router.addHook('createGoal', function() {})).toBe(true);

      var route = router.getRoutes().createGoal;
      expect(route).toEqual(jasmine.any(Route));
      expect(route.path).not.toBeDefined();
      expect(route.hooks.length).toEqual(1);
    });


    it('skips adding hook when for invalid route name', function() {
      expect(router.addHook('invalidName', function() {})).toBe(false);
    });


    it('skips adding hook when for not a function', function() {
      router.addRoute('getGoal', data);
      var route = router.getRoutes().getGoal;
      spyOn(route.hooks, 'push');

      expect(router.addHook('getGoal', 'not hook')).toBe(false);
      expect(route.hooks.push).not.toHaveBeenCalled();
    });
  });
});
