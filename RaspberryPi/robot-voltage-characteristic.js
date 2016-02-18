var util = require('util');
var bleno = require('bleno');
var robot = require('./robot');

function RobotVoltageCharacteristic(robot) {
  var self = this
  this.robot = robot;
  bleno.Characteristic.call(this, {
      uuid: '31491EECD9BB41BD8D632282ABAE6814',
      properties: ['notify'],
      descriptors: [
	  new bleno.Descriptor({
	      uuid: '2902',
	      value: 'Robot lipo voltage'
	  })
      ],
      onSubscribe : function(maxSize, callback) {
	  this.robot.on('voltage', function(volts) {
	      var buffer = new Buffer(Array(4 * 2 * volts.length))
	      for (i = 0; i < volts.length; i++) {
		  buffer.writeIntLE(volts[i][0], i * 8)
		  buffer.writeFloatLE(volts[i][1], i * 8 + 4)
	      }
	      callback(buffer)
	  })
      }
  });
}

util.inherits(RobotVoltageCharacteristic, bleno.Characteristic);

module.exports = RobotVoltageCharacteristic;
