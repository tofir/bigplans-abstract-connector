'use strict';

var util = require('util');

/* GLOBAL (CONNECTOR) */
function ConnectorError(name, error, message) {
  var err = Error.call(error, message);
  err.name = name || 'ConnectorError';

  return err;
}

util.inherits(ConnectorError, Error);
module.exports.ConnectorError = ConnectorError;


function AbstractConnectorError (message) {
  return new ConnectorError('AbstractConnectorError', this, message);
}

util.inherits(AbstractConnectorError, Error);
module.exports.AbstractConnectorError = AbstractConnectorError;


/* URL HELPER */
function ParamError(name, params) {
  params = params || [];
  var pattern = 'Error while processing param: %s,\nrequired params: [ %s ]';
  var message = util.format(pattern, name, params.join(', '));

  return new ConnectorError('ParamError', this, message);
}

util.inherits(ParamError, Error);
module.exports.ParamError = ParamError;


/* DISPATCHER */
function DispatcherError(name, error, message) {
  name = name || 'DispatcherError';
  return new ConnectorError(name, error, message);
}

util.inherits(DispatcherError, Error);
module.exports.DispatcherError = DispatcherError;



/* VALIDATOR */
function ValidatorError(name, error, message) {
  name = name || 'ValidatorError';
  return new ConnectorError(name, error, message);
}

util.inherits(ValidatorError, Error);
module.exports.ValidatorError = ValidatorError;


function ValidatorOptionError(message) {
  message += ' is required to perform validation';
  return new ValidatorError('ValidatorOptionError', this, message);
}

util.inherits(ValidatorOptionError, Error);
module.exports.ValidatorOptionError = ValidatorOptionError;


function ValidationError(name, message) {
  var pattern = 'Field "%s" validation failed.';

  if(message) { pattern += ' %s'; }
  message = message || '';
  message = util.format(pattern, name, message);

  return new ValidatorError('ValidationError', this, message);
}

util.inherits(ValidationError, Error);
module.exports.ValidationError = ValidationError;
