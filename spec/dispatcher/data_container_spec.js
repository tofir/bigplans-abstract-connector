'use strict';

var DataContainer = require('../../lib/dispatcher/data_container');

describe('DataContainer', function() {
  var dataContainer;
  beforeEach(function() {
    dataContainer = new DataContainer();
  });

  describe('constructor', function() {
    it('assigns empty data', function() {
      expect(dataContainer.getData()).toEqual({});
    });

    it('assigns deafult values', function() {
      dataContainer = new DataContainer({key: 'value'});
      expect(dataContainer.getData()).toEqual({key: 'value'});
    });
  });


  describe('getData', function() {
    it('uses valid data object', function() {
      var data = dataContainer.getData();
      data.item = 'value';

      expect(dataContainer.getData()).toEqual(data);
    });
  });


  describe('setData', function() {
    it('resets data object', function() {
      var data = dataContainer.getData();
      data.item = 'value';

      dataContainer.setData();

      expect(dataContainer.getData()).toEqual({});
    });

    it('applies changes to the data object', function() {
      var data = {name: 'value'};
      dataContainer.setData(data);

      expect(dataContainer.getData()).toEqual(data);
    });
  });
});
