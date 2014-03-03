'use strict';

/**
* Validator for Object fields
* Usage:
* var user = {name: 'John'};
* var validator = new Validator({object: user});
*
* validation set options:
* {
*   <expression>: <condition>,
*   OR
*   expression: function(obj) { return bool; },
*   message: ErrorMessage for the exception
* }
*
* Add new rules for validation:
* validator.add('name', {
*   type: 'string',
*   presence: true,
*   message: 'Name should be a non-empty string'
* });
*
* Multiple rules for the same field will be aggregated:
* validator
*   .add('name', { type: 'string', message: 'Name should be a string'})
*   .add('name', { presence: true, message: 'Name should exist'});
*
* Multiple fields rules setup:
* validator.setup({
*   name: {
*     type: 'string',
*     presence: true,
*     message: 'Name should be a string'
*   },
*   email: {
*     presence: true,
*     message: 'Email should exist'
*   }
* });
*
* Run validation:
* validator.checkAll() || validator.check('name');
*
* if user.name is not of String type,
* the ValidationError will be thrown
*
* Chaining is allowed as well:
* new Validator({object: user})
*   .add('name', { type: 'string', message: 'Name should be a string'})
*   .add('name', { presence: true, message: 'Name should exist'})
*   .add('email', { type: 'string', message: 'Email should be a string'})
*   .checkAll();
**/

var errors = require('./errors');
var ValidationError = errors.ValidationError;
var ValidatorOptionError = errors.ValidatorOptionError;

// private variables
var validations = {};


/* VALIDATORS */
/**
* Validator Function format:
* function (obj, name, condition) { return bool; }
**/
function presenceValidator(obj, name, cond) {
  // jshint -W018
  return !!obj[name] === !!cond;
}

function equalityValidator(obj, name, cond) {
  return obj[name] === cond;
}

function typeValidator(obj, name, cond) {
  return typeof obj[name] === cond;
}

function existsInValidator(obj, name, list) {
  if(!Array.isArray(list)) { return false; }
  // jshint -W052
  return ~list.indexOf(obj[name]);
}

function customValidator(obj, name, expr) {
  return expr(obj, name);
}
/* VALIDATORS END */

var VALIDATORS = {
  type      : typeValidator,
  presence  : presenceValidator,
  equals    : equalityValidator,
  existsIn  : existsInValidator,
  expression: customValidator
};

/* GET VALIDATION EXPRESSION */
function getValidator(expr) {
  if(typeof expr === 'function') {
    return expr;
  }

  return VALIDATORS[expr];
}

// main validation handler wrapper
function getHandler(options, condition, expr) {
  return function(object) {
    var name = options.name;
    var message = options.message;

    if(!expr(object, name, condition)) {
      throw new ValidationError(name, message);
    }
  };
}

function getExpression(key, condition, options) {
  var validator = getValidator(key);
  if(!validator) {
    throw new ValidatorOptionError('KNOWN EXPRESSION');
  }

  var expression = getHandler(options, condition, validator);
  return expression;
}

function getExpressions(name, set) {
  if(!name) { throw new ValidatorOptionError('field NAME'); }

  set = set || {};
  var options = { name: name, message: set.message };
  delete set.message;

  var keys = Object.keys(set);

  return keys.map(function(key) {
    return getExpression(key, set[key], options);
  });
}
/* GET VALIDATION EXPRESSION END */


function Validator(object) {
  this.object = object;
  validations = {};
}


/**
* Setup for a single field:
* validator.add(<NAME>, <VALIDATION SET OBJECT>)
*
* VALIDATION SET:
* {
*   <expression>: <condition>,
*   OR
*   expression: function(obj) { return bool; },
*   message: 'ErrorMessage for the exception'
* }
*
* chaining is allowed here
**/
Validator.prototype.add = function(name, set) {
  var expressions = getExpressions(name, set);
  validations[name] = validations[name] || [];

  expressions.forEach(function(expression) {
    validations[name].push(expression);
  });

  return this;
};

/**
* Setup for multiple fields:
* validator.setup({ <NAME> : <VALIDATION SET OBJECT>, ... })
*
* chaining is allowed here
**/
Validator.prototype.setup = function(settings) {
  for(var name in settings) {
    this.add(name, settings[name]);
  }

  return this;
};

/**
* Check a field:
* validator.check(<NAME>)
*
* chaining is allowed here
**/
Validator.prototype.check = function(name) {
  var validators = validations[name];
  if(!validators) { return this; }

  var object = this.object;
  validators.forEach(function(validate) {
    validate(object);
  });

  return this;
};

/**
* Check all the fields, have been set up previously
*
* chaining is allowed here
**/
Validator.prototype.checkAll = function() {
  Object.keys(validations)
    .forEach(this.check.bind(this));

  return this;
};

module.exports = Validator;
