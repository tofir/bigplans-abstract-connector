'use strict';

var Translator = require('../lib/translator');

describe('Translator', function() {
  var translator;
  var itemData;
  var translateHook;

  beforeEach(function() {
    translator = new Translator();
    itemData = { name: 'itemOne' };
    translateHook = jasmine.createSpy('translateHook').andReturn({});
  });

  describe('addRule', function() {
    it('assigns a rule', function() {
      translator.addRule('item', { toLocal: translateHook });

      translator.translate('getItem', 'toLocal', itemData);
      expect(translateHook).toHaveBeenCalledWith(itemData);

      expect(translator.translate('getItem', 'fromLocal', itemData).data).toEqual(itemData);
    });


    it('assigns default rules on blank data', function() {
      translator.addRule('item');

      expect(translator.translate('getItem', 'toLocal', itemData).data).toEqual(itemData);
      expect(translator.translate('getItem', 'fromLocal', itemData).data).toEqual(itemData);
    });
  });


  describe('translate', function() {
    var translation;

    beforeEach(function() {
      translator.addRule('goal');
      translator.addRule('item', { toLocal: translateHook });
      translation = {item: true};
      translateHook.andReturn(translation);
    });


    it('chooses valid translation rule', function() {
      translator.translate('getItem', 'toLocal', itemData);
      expect(translateHook).toHaveBeenCalledWith(itemData);
    });


    describe('meta name', function() {
      describe('for know name prefix', function() {
        it('returns valid meta for get prefix', function() {
          var converted = translator.translate('getItem', 'toLocal', itemData);
          expect(converted.meta).toEqual('item');
        });


        it('returns valid meta for create prefix', function() {
          var converted = translator.translate('createItem', 'toLocal', itemData);
          expect(converted.meta).toEqual('item');
        });


        it('returns valid meta for udpate prefix', function() {
          var converted = translator.translate('updateItem', 'toLocal', itemData);
          expect(converted.meta).toEqual('item');
        });
      });


      describe('for unknown name prefix', function() {
        it('returns provided value', function() {
          var converted = translator.translate('nonGetItem', 'toLocal', itemData);
          expect(converted.meta).toEqual('nongetitem');
        });
      });
    });


    describe('translation hook', function() {
      it('returns valid value for known name', function() {
        var converted = translator.translate('getItem', 'toLocal', itemData);
        expect(converted.data).toEqual(translation);
      });


      it('returns provided value for unknown name', function() {
        var converted = translator.translate('fetchData', 'toLocal', itemData);
        expect(converted.data).toEqual(itemData);
        expect(translateHook).not.toHaveBeenCalled();
      });


      it('returns provided value on invalid translation hook return value', function() {
        translateHook.andReturn(null);
        var converted = translator.translate('getItem', 'toLocal', itemData);
        expect(converted.data).toEqual(itemData);
      });
    });


    describe('incoming data format', function() {
      it('traverse an array', function() {
        var converted = translator.translate('getItem', 'toLocal', [itemData]);
        expect(converted.data).toEqual([translation]);
      });


      it('takes existing object', function() {
        var converted = translator.translate('getItem', 'toLocal', 'data');

        expect(converted.data).toEqual(translation);
        expect(translateHook).toHaveBeenCalledWith('data');
      });


      it('returns provided value on invalid translation hook return value', function() {
        translateHook.andReturn(null);
        var converted = translator.translate('getItem', 'toLocal', itemData);
        expect(converted.data).toEqual(itemData);
      });
    });


    describe('translation rule choose', function() {
      it('uses defaultRule on invalid translation pass', function() {
        var converted = translator.translate('getItem', 'toUnknown', itemData);

        expect(converted.data).toEqual(itemData);
        expect(translateHook).not.toHaveBeenCalled();
      });


      it('uses defaultRule on missing translation', function() {
        var converted = translator.translate('getItem', 'fromLocal', itemData);

        expect(converted.data).toEqual(itemData);
        expect(translateHook).not.toHaveBeenCalled();
      });
    });
  });
});
