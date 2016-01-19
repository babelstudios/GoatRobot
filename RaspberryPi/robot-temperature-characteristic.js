var util = require('util');
var bleno = require('bleno');
var robot = require('./robot');

function RobotTemperatureCharacteristic(robot) {
  var self = this
  this.robot = robot;
  bleno.Characteristic.call(this, {
      uuid: '31491EECD9BB41BD8D632282ABAE6813',
      properties: ['notify'],
      descriptors: [
	  new bleno.Descriptor({
	      uuid: '2902',
	      value: 'Internal Robot temperature'
	  })
      ],
      onSubscribe : function(maxSize, callback) {
	  this.robot.on('temperature', function(temp) {
	      var buffer = new Buffer(4)
	      buffer.writeFloatLE(temp, 0)
	      callback(buffer)
	  })
      }
  });
}

util.inherits(RobotTemperatureCharacteristic, bleno.Characteristic);

module.exports = RobotTemperatureCharacteristic;
