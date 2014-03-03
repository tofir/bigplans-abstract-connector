'use strict';

var Route = require('../../lib/router/route');

describe('Route', function() {
  var route;
  var data;
  beforeEach(function() {
    data = {
      path: 'issues/%{userId}',
      handler: function() {},
      hooks: [ function() {} ]
    };
    route = new Route('getGoal');
  });


  describe('constructor', function() {
    it('assigns default data', function() {
      expect(route.name)    .toEqual('getGoal');
      expect(route.method)  .toEqual('get');
      expect(route.data)    .toEqual([]);
      expect(route.hooks)   .toEqual([]);
      expect(route.headers) .toEqual({});
    });
  });


  describe('validation', function() {
    it('passes validation on correct fields', function() {
      expect(function() { route.append(data); }).not.toThrow();
    });

    describe('wrong fields', function() {
      it('fails on name validation', function() {
        route.name = 'unknown';
        expect(function() { route.append(data); }).toThrow();
      });


      it('fails on path validation', function() {
        data.path = null;
        expect(function() { route.append(data); }).toThrow();
      });

      describe('hooks', function() {
        it('fails when not an array', function() {
          data.hooks = {};
          expect(function() { route.append(data); }).toThrow();
        });


        it('fails when not an array of fucntions', function() {
          data.hooks = [{}];
          expect(function() { route.append(data); }).toThrow();
        });
      });
    });
  });


  describe('append', function() {
    it('appends default data', function() {
      route = new Route('getGoals');
      route.append({
        path:     'some/path',
        method:   null,
        data:     null,
        hooks:    null,
        handler:  null
      });

      expect(route.method)  .toEqual('get');
      expect(route.data)    .toEqual([]);
      expect(route.hooks)   .toEqual([]);
      expect(route.handler) .toEqual(jasmine.any(Function));
    });


    it('appends valid data', function() {
      data.data = ['param'];
      data.method = 'post';

      route.append(data);

      expect(route.path)    .toEqual(data.path);
      expect(route.method)  .toEqual(data.method);
      expect(route.data)    .toEqual(data.data);
      expect(route.hooks)   .toEqual(data.hooks);
      expect(route.handler) .toEqual(data.handler);
    });
  });
});
