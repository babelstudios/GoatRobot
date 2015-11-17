var util = require('util');
var bleno = require('bleno');
var robot = require('./robot');

function RobotMotorCharacteristic(robot, motor) {
  bleno.Characteristic.call(this, {
      uuid: '31491EECD9BB41BD8D632282ABAE681' + motor,
      properties: ['notify', 'write'],
      descriptors: [
	  new bleno.Descriptor({
	      uuid: '2901',
	      value: 'Set throttle for motor ' + motor + '.'
	  })
      ]
  });
  this.motor = motor;
  this.robot = robot;
}

util.inherits(RobotMotorCharacteristic, bleno.Characteristic);

RobotMotorCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
    if (offset) {
	callback(this.RESULT_ATTR_NOT_LONG);
    }
    else if (data.length !== 2) {
	callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
    }
    else {
	var throttle = data.readInt16LE(0);
	this.robot.setThrottle(throttle, this.motor);
	callback(this.RESULT_SUCCESS);
    }
};

module.exports = RobotMotorCharacteristic;
