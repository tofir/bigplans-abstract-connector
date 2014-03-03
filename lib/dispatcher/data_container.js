'use strict';

// private variables
var data;
var defaults;


function appendDefaults(container) {
  for(var key in defaults) {
    container[key] = defaults[key];
  }
}
/**
* Data Container Object
* used to pass data between middleware actions
**/
function DataContainer(set) {
  defaults = set || {};
  data = {};
  appendDefaults(data);
}

DataContainer.prototype.getData = function() {
  return data;
};

DataContainer.prototype.setData = function(set) {
  data = set || {};
  appendDefaults(data);
};

module.exports = DataContainer;
