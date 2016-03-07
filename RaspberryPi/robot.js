var util = require('util');
var EventEmitter = require('events').EventEmitter;
var servoblaster = require('servoblaster');
var robotMonitor = require('./robot-monitor')

function Robot() {
    var self = this
    // Motors
    this.leftMotorStream = servoblaster.createWriteStream(0) // gpio 4
    this.rightMotorStream = servoblaster.createWriteStream(1) // gpio 17
    // Temperature and lipo monitoring
    this.monitor = new robotMonitor.RobotMonitor([1, 2])
    this.monitor.on('temperature', function(temp) {
	self.emit('temperature', temp)
    })
    this.monitor.on('voltage', function(volts) {
	self.emit('voltage', volts)
    })
}

util.inherits(Robot, EventEmitter)

Robot.prototype.setThrottle = function(throttle, motor) {
    var pulse = throttle * 5 + 1500
    if (motor == 1) {
	this.leftMotorStream.write(pulse + 'us');
    } else if (motor == 2) {
	this.rightMotorStream.write(pulse + 'us');
    }	
    console.log('Set throttle: ', pulse, ' motor: ', motor);
};

module.exports.Robot = Robot;
