'use strict';


var request = require('request');
var sinon = require('sinon');
require('jasmine-sinon');

var Dispatcher = require('../../lib/dispatcher');
var ParamsHelper = require('../../lib/params_helper');
var errors = require('../../lib/errors');


describe('Dispatcher', function() {
  var sandbox;

  beforeEach(function() { sandbox = sinon.sandbox.create(); });
  afterEach(function() { sandbox.restore(); });

  var dispatcher;
  var translator;
  var paramsHelper;

  beforeEach(function() {
    translator = { translate: sinon.stub() };
    paramsHelper = new ParamsHelper('http://test.tld/');

    dispatcher = new Dispatcher({
      translator: translator,
      paramsHelper: paramsHelper
    });
  });


  // test constructor params
  describe('constructor', function() {
    it('gets initialized with options', function() {
      expect(function() {
        dispatcher = new Dispatcher({ translator: {}, paramsHelper: paramsHelper });
      }).not.toThrow();
    });


    it('fails init with broken options set', function() {
      expect(function() { dispatcher = new Dispatcher(); }).toThrow();
    });
  });


  describe('armed with route', function() {
    var armed;
    var route;
    var req;
    var res;

    beforeEach(function() {
      route = {
        name:     'testRoute',
        handler:  sinon.stub(),
        method:   'get',
        path:     'goals',
        data:     {},
        headers:  {}
      };

      armed = dispatcher.use(route);
      // express.js/request
      req = { param: sinon.stub() };
      // express.js/response
      res = { json: sinon.stub() };
    });


    describe('action', function() {
      var action;

      function getAction() {
        action = armed.action();
        return action;
      }


      it('applies data', function() {
        getAction();
        expect(action).toEqual(jasmine.any(Function));
        expect(action.length).toEqual(2);
      });


      describe('http requests', function() {
        var resBody;

        beforeEach(function() {
          resBody = {};
          translator.translate.returns({ meta: 'goal', data: 'translation' });
        });

        describe('translator methods', function() {
          it('applies toLocal on receiving data', function(done) {
            toEndReqestUse(done);
            var resObjects = [{itemId: 1}];

            stubHttpReponseFor({ url: 'http://test.tld/goals' })
              .andRespondWith(200, resObjects);

            getAction()(req, res);

            expect(translator.translate).toHaveBeenCalledWith(route.name, 'toLocal', resObjects);
          });


          it('does not trigger translate on invalid entity', function(done) {
            toEndReqestUse(done);

            stubHttpReponseFor({ url: 'http://test.tld/goals' })
              .andRespondWith(200, 'valid-translation-response');

            getAction()(req, res);

            expect(translator.translate).not.toHaveBeenCalled();
          });


          it('applies fromLocal on sending data', function(done) {
            toEndReqestUse(done);
            var dataObj = { id: 1 };
            route.method = 'post';
            route.data = { dataObj: false };
            stubReqParams({ dataObj: { id: 1 } });

            stubHttpReponseFor({ method: 'post', url: 'http://test.tld/goals', body: {dataObj: 'translation'} })
              .andRespondWith(200, 'valid-translation-response');

            getAction()(req, res);
            expect(translator.translate).toHaveBeenCalledWith(route.name, 'fromLocal', dataObj);
          });
        });


        it('converts path options', function(done) {
          toEndReqestUse(done);

          route.path = 'goals/%{id}/%{name}';
          stubReqParams({ id: 1, name: 'qwerty' });

          stubHttpReponseFor({ url: 'http://test.tld/goals/1/qwerty' })
            .andRespondWith(200, 'path-options-response');

          getAction()(req, res);

          expect(route.handler).toHaveBeenCalledWith('path-options-response');
        });


        it('converts data params', function(done) {
          toEndReqestUse(done);

          route.method = 'post';
          route.data = { id: false };
          stubReqParams({ id: 1 });

          stubHttpReponseFor({
            url   : 'http://test.tld/goals',
            method: 'post',
            body  : { id: 1 }
          }).andRespondWith(200, 'data-params-response');

          getAction()(req, res);

          expect(route.handler).toHaveBeenCalledWith('data-params-response');
        });


        describe('params validation', function() {
          beforeEach(function() {
            route.path = 'goals/%{id}';
            route.data = {goal: 'ticket'};
          });


          it('fails on invalid path params', function() {
            expect(function() {
              getAction()(req, res);
            }).toThrow(new errors.ParamError('id', ['id', 'goal']));
          });


          it('fails on invalid data params', function() {
            stubReqParams({ id: 1 });

            expect(function() {
              getAction()(req, res);
            }).toThrow(new errors.ParamError('goal', ['id', 'goal']));
          });


          it('passes validation for valid params', function() {
            stubReqParams({ id: 1, goal: {number: 1} });

            expect(function() {
              getAction()(req, res);
            }).not.toThrow();
          });
        });


        it('applies valid request method', function(done) {
          toEndReqestUse(done);

          route.method  = 'post';
          stubReqParams({ id: 1 });

          stubHttpReponseFor({
            url   : 'http://test.tld/goals',
            method: 'post'
          }).andRespondWith(200, 'valid-method-response');

          getAction()(req, res);

          expect(route.handler).toHaveBeenCalledWith('valid-method-response');
        });


        it('triggers end when handler does not expect DONE action', function(done) {
          toEndReqestUse(done);

          stubHttpReponseFor({url: 'http://test.tld/goals'})
            .andRespondWith(200, resBody);

          route.handler = function() {
            expect(arguments.length).toEqual(1);
            expect(arguments[0]).toEqual(resBody);
          };

          getAction()(req, res);

          var jsend = {
            status: 'success',
            data: { goal: 'translation' },
            message: ''
          };

          expect(res.json).toHaveBeenCalledWith(jsend);
        });


        describe('timeout handling', function() {
          var clock;
          beforeEach(function() {
            clock = sinon.useFakeTimers();
          });

          afterEach(function() {
            clock.restore();
          });


          it('forces connection close on timeout', function(done) {
            toEndReqestUse(done);

            route.handler = function(data, end) {
              expect(end).toEqual(jasmine.any(Function));
            };

            stubHttpReponseFor({url: 'http://test.tld/goals'})
              .andRespondWith(200, resBody);

            getAction()(req, res);

            expect(res.json).not.toHaveBeenCalled();

            clock.tick(5000);
            expect(res.json).toHaveBeenCalled();
          });
        });


        it('performs correct http request', function(done) {
          toEndReqestUse(done);

          route.method  = 'post';
          route.path    = '/%{projectName}/goals';
          route.data    = {id: false};

          stubReqParams({ id: 1, projectName: 'qwerty' });

          stubHttpReponseFor({
            url   : 'http://test.tld/qwerty/goals',
            method: 'post',
            body  : { id: 1 }
          }).andRespondWith(200, resBody);

          getAction()(req, res);

          var jsend = {
            status: 'success',
            data: resBody, // initial data with no translation
            message: ''
          };

          expect(res.json).toHaveBeenCalledWith(jsend);
        });


        it('responds with status error', function(done) {
          toEndReqestUse(done);
          var err = new Error('test failure');

          stubHttpReponseFor({url: 'http://test.tld/goals'})
            .andRespondWith(null, null, err);

          var jsend = {
            status: 'error',
            data: {},
            message: err.message
          };

          getAction()(req, res);

          expect(res.json).toHaveBeenCalledWith(jsend);
        });
      });
    });


    describe('hooks', function() {
      var hooks;
      function getHooks() {
        hooks = armed.beforeHooks();
        return hooks;
      }

      beforeEach(function() {
        route.hooks = [];
      });


      it('performs hooks building', function() {
        getHooks();
        expect(hooks).toEqual(jasmine.any(Array));
        expect(hooks.length).toEqual(1);
        expect(hooks[0]).toEqual(jasmine.any(Function));
      });


      it('apllies initContainerHook', function() {
        var data;
        route.hooks = [function() {
          this.called = true;
          data = this;
        }];

        getHooks();

        applyHooks(hooks);
        expect(data.called).toEqual(true);

        data.called = false;

        applyHooks(hooks);
        expect(data.called).toEqual(true);
      });


      describe('timeout handling', function() {
        var clock;
        beforeEach(function() {
          clock = sinon.useFakeTimers();
        });

        afterEach(function() {
          clock.restore();
        });


        it('forces terminate on timeout', function() {
          var next    = sinon.stub();
          var hook    = sinon.stub();

          route.hooks = [hook];

          getHooks();
          hooks[1](req, res, next);

          expect(next).not.toHaveBeenCalled();

          clock.tick(5000);

          expect(hook).toHaveBeenCalledWith(req, res, next);
          expect(next).toHaveBeenCalled();
        });
      });
    });


    it('passes correct data within hooks and action', function(done) {
      var response = stubHttpReponseFor({ url: 'http://test.tld/goals' })
        .andRespondWith(200, 'result');

      translator.translate.returns({ meta: 'goals', data: 'translated result' });

      var hookOne = function(req, res, end) {
        this.one = 'triggered';
        end();
      };
      var hookTwo = function(req, res, end) {
        this.two = 'triggered';
        end();
      };

      route.hooks = [ hookOne, hookTwo ];

      route.handler = function(data, apiRes, end) {
        expect(this.one).toBeDefined();
        expect(this.two).toBeDefined();
        expect(this.one).toEqual('triggered');
        expect(this.two).toEqual('triggered');

        expect(data).toEqual('result');
        expect(apiRes).toEqual(response);

        end(data);
        done();
      };

      var callbacks = armed.beforeHooks();
      callbacks.push(armed.action());

      applyHooks(callbacks);
    });


    function applyHooks(list) {
      var next = sinon.stub();
      list.forEach(function(callback) {
        callback(req, res, next);
      });
    }

    function responseHandler(finalize) {
      return jasmine.createSpy('responseHandler')
        .andCallFake(finalize);
    }

    function toEndReqestUse(done) {
      res.json = responseHandler(function() { done(); });
    }

    function stubReqParams(params) {
      for(var name in params) {
        req.param.withArgs(name).returns(params[name]);
      }
    }
  });


  function stubHttpReponseFor(requestOptions) {
    return {
      andRespondWith: function(statusCode, json, err) { // jshint -W074
        var url     = requestOptions.url;
        var method  = requestOptions.method || 'get';

        var options = {
          uri     : url,
          body    : requestOptions.body     || {},
          headers : requestOptions.headers  || {},
          json    : true
        };

        var res = {
          statusCode : statusCode,
          request    : { href: url }
        };

        var alreadyStubbed = 'spyCall' in request[method];
        var stub = alreadyStubbed ? request[method] : sandbox.stub(request, method);

        stub.withArgs(options).yields(err, res, json);

        return res;
      }
    };
  }
});
