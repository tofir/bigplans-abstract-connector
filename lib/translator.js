'use strict';

// private variables
var rules = {};

/**
* default transformation
* for the providede objects
**/
function defaultRule(data) {
  return data;
}

/**
* wrapper for the existent rule
* ensures that rule returns an Object
**/
function getRuleHandler(rule) {
  return function(data) {
    var translation = rule(data);
    // check rule success status:
    if(translation && typeof translation === 'object' && !Array.isArray(translation)) {
      return translation;
    }

    return defaultRule(data);
  };
}

/**
* get a handler to thanslate entites
**/
function getRule(name, direction) {
  var ruleOptions = rules[name];
  var rule = ruleOptions && ruleOptions[direction];

  if(rule && typeof rule === 'function') {
    return getRuleHandler(rule);
  }

  return getRuleHandler(defaultRule);
}

/**
* perfroms magic entity name guessing
* from the provided string
* will look for the name in the "rules" list
*
* guessName('getGoals') => 'goal'
**/
function guessName(needle) {
  var names = Object.keys(rules);

  for(var i = 0; i < names.length; i++) {
    var name = names[i];
    var regex = new RegExp(name, 'i');
    if(regex.test(needle)) { return name; }
  }
}

/**
* getMetaName('getGoals') => 'goals'
**/
function getMetaName(needle) {
  return needle.toLowerCase().replace(/^(get|create|update)/, '');
}


function Translator() {
  rules = {};
}

/**
* Usage example:
* translator.addRule('goal', options);
*
* options example: {
*   toLocal: function(ticket) {
*     return {
*       'number': ticket.number
*     };
*   },
*
*   fromLocal: function(goal) {
*     return {
*       'number': goal.number
*     };
*   }
* }
**/
Translator.prototype.addRule = function(name, set) {
  if(!name) { return false; }
  set = set || {};

  rules[name] = {
    toLocal:    set.toLocal,
    fromLocal:  set.fromLocal
  };
  return true;
};


/**
* Usage example:
* translator.translate('getGoal', 'toLocal', itemData); => goalData
**/
Translator.prototype.translate = function(needle, direction, data) {
  var name = guessName(needle);
  var rule = getRule(name, direction);
  var meta = getMetaName(needle);

  data = Array.isArray(data) ? data.map(rule) : rule(data);

  return {
    meta: meta,
    data: data
  };
};

module.exports = Translator;
