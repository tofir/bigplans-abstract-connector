'use strict';

var Validator = require('../lib/validator');
var errors = require('../lib/errors');

var validationError = function(field) {
  return new errors.ValidationError(field);
};

describe('Validator', function() {
  var validator;
  var testObject;
  var expression;

  beforeEach(function() {
    expression = jasmine.createSpy('expression').andReturn(true);

    testObject = { fieldOne: 'one' };
    validator = new Validator(testObject);
  });

  describe('setup', function() {
    it('adds a single rule', function() {
      validator.add('fieldOne', { expression: expression });
      validator.check('fieldOne');

      expect(expression).toHaveBeenCalledWith(testObject, 'fieldOne');
    });

    it('adds two rules for the same field', function() {
      var otherExpression = jasmine.createSpy('expression').andReturn(true);
      validator
        .add('fieldOne', { expression: expression })
        .add('fieldOne', { expression: otherExpression });

      validator.check('fieldOne');

      expect(expression).toHaveBeenCalledWith(testObject, 'fieldOne');
      expect(otherExpression).toHaveBeenCalledWith(testObject, 'fieldOne');
    });

    it('adds a set of rules', function() {
      validator.setup({
        fieldTwo: { expression: expression }
      });

      validator.check('fieldTwo');
      expect(expression).toHaveBeenCalledWith(testObject, 'fieldTwo');
    });

    it('fails on invalid field setup', function() {
      expect(function() {
        validator.add('fieldTwo', { notKnown: true });
      }).toThrow(new errors.ValidatorOptionError('KNOWN EXPRESSION'));
    });

    it('fails on blank field call', function() {
      expect(function() {
        validator.add(null, {});
      }).toThrow(new errors.ValidatorOptionError('field NAME'));
    });
  });

  describe('validations', function() {
    describe('validations run', function() {
      beforeEach(function() {
        validator.add('fieldOne', { expression: expression });
      });

      it('performs test on a single field', function() {
        expect(function() {
          validator.check('fieldOne');
        }).not.toThrow();
      });

      it('performs test on all fields', function() {
        validator.add('fieldTwo', { presence: true });

        expect(function() {
          validator.checkAll();
        }).toThrow(validationError('fieldTwo'));

        expect(expression.callCount).toEqual(1);
      });
    });

    describe('predefined', function() {
      describe('presence', function() {
        var validate = function() { validator.check('presenceField'); };

        beforeEach(function() {
          validator.add('presenceField',  { presence: true });
        });

        it('throws on field absence', function() {
          expect(validate).toThrow(validationError('presenceField'));
        });

        it('throws on blank field data', function() {
          testObject.presenceField = '';
          expect(validate).toThrow(validationError('presenceField'));
        });

        it('passes on presence', function() {
          testObject.presenceField = 123;
          expect(validate).not.toThrow();
        });
      });

      describe('type', function() {
        var validate = function() { validator.check('typeField'); };

        beforeEach(function() {
          validator.add('typeField', { type: 'function' });
        });

        it('fails on a wrong type', function() {
          testObject.typeField = 'typeof nonFunction';
          expect(validate).toThrow(validationError('typeField'));
        });

        it('passes on valid type', function() {
          testObject.typeField = function() {};
          expect(validate).not.toThrow();
        });
      });

      describe('equals', function() {
        var validate = function() { validator.check('equalityField'); };

        beforeEach(function() {
          validator.add('equalityField', { equals: 123 });
        });

        it('fails on a non equal data', function() {
          testObject.equalityField = 555;
          expect(validate).toThrow(validationError('equalityField'));
        });

        it('passes on equal data', function() {
          testObject.equalityField = 123;
          expect(validate).not.toThrow();
        });
      });

      describe('existsIn', function() {
        var validate = function() { validator.check('existsInField'); };

        beforeEach(function() {
          validator.add('existsInField', { existsIn: [1, 2, 3] });
        });

        it('fails on a non equal data', function() {
          testObject.existsInField = 555;
          expect(validate).toThrow(validationError('existsInField'));
        });

        it('passes on equal data', function() {
          testObject.existsInField = 1;
          expect(validate).not.toThrow();

          testObject.existsInField = 2;
          expect(validate).not.toThrow();
        });
      });

      describe('expression', function() {
        var validate = function() { validator.check('expressionField'); };

        beforeEach(function() {
          validator.add('expressionField', { expression: expression });
        });

        it('fails on a non equal data', function() {
          expression.andReturn(false);

          expect(validate).toThrow(validationError('expressionField'));
          expect(expression).toHaveBeenCalledWith(testObject, 'expressionField');
        });

        it('passes on expression returned true', function() {
          expression.andReturn(true);

          expect(validate).not.toThrow();
          expect(expression).toHaveBeenCalledWith(testObject, 'expressionField');
        });
      });
    });
  });
});
