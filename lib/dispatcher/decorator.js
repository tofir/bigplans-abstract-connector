'use strict';

/**
* Decorator object
* used to convert response data to JSEND-formatted message
**/
function Decorator() {
}

function isError(result) {
  return result instanceof Error;
}

function isSuccess(res) {
  return res.statusCode === 200;
}

Decorator.toJsend = function(result, apiRes) {
  var jsendData = {};
  var status = 'fail';
  var message = '';


  if(isError(result)) {
    // var debugMessage = data.stack;
    status = 'error';
    message = result.message;
  } else if(isSuccess(apiRes)) {
    status = 'success';
    jsendData = result;
  } else {
    // var debugMessage = apiRes.statusCode + apiRes.body + data;
    message = result || 'unknown error';
  }

  return {
    status: status,
    data: jsendData,
    message: message
  };
};


module.exports = Decorator;
