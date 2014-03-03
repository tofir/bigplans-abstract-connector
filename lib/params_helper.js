'use strict';

var errors = require('./errors');
var ParamError = errors.ParamError;

// private variables
var baseUrl;

/* parse path and create url Functionality*/
function ParamsHelper(base) {
  baseUrl = base.replace(/\/+$/, '');
}

function validateParams(params, req) {
  params.forEach(function(name) {
    if(!req.param(name)) {
      throw new ParamError(name, params);
    }
  });
}

/**
* Parse PATH data-params
*
* pathParams('/user/%{userId}/account');
*   => { userId: '%{userId}' }
*/
function pathParams(path) {
  var re = /%\{([a-z]+)\}/gi;
  var matches = {};
  var match;

  // jshint -W084
  while(match = re.exec(path)) {
    // matches[<NAME>] = '%{<NAME>}'
    matches[ match[1] ] = match[0];
  }

  return matches;
}


function applyPathParams(path, params, req) {
  for(var name in params) {
    var param = req.param(name);
    path = path.replace(params[name], param);
  }

  return path;
}


function applyBaseUrl(path) {
  return baseUrl + '/' + path.replace(/^\/+/, '');
}


/**
* Build URL params from pattern path string and req object
* NOTE: assuming that request object <req> has already sanitized params
*
* prepareUri('/user/%{userId}/account', <request# { userId: 1 }>);
*   => '/user/1/account'
**/
function prepareUri(path, params, req) {
  path = applyPathParams(path, params, req);
  path = applyBaseUrl(path);

  return path;
}


function prepareBody(params, req) {
  var data = {};

  for(var from in params) {
    var to = params[from] || from;
    data[to] = req.param(from);
  }

  return data;
}

ParamsHelper.prototype.getBaseUrl = function() {
  return baseUrl;
};


ParamsHelper.prototype.bodyExpected = function(method) {
  // jshint -W052, -W018
  return !!( ~['post', 'put'].indexOf(method) );
};


ParamsHelper.prototype.getRequestData = function(route, req) {
  var path = route.path;

  var queryStringParams = pathParams(path);
  var bodyParams = Object.keys(route.data);
  var required = Object.keys(queryStringParams).concat(bodyParams);

  validateParams(required, req);

  var uri = prepareUri(path, queryStringParams, req);
  var body;

  if(this.bodyExpected(route.method)) {
    body = prepareBody(route.data, req);
  }

  return {
    uri:  uri,
    body: body
  };
};

module.exports = ParamsHelper;
