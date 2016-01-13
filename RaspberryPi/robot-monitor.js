var SPI = require('pi-spi')
var spi = SPI.initialize('/dev/spidev0.0')

var util = require('util');
var EventEmitter = require('events').EventEmitter;

function RobotMonitor(channels) {
    this.emitTemperature()
    var self = this
    channels.forEach( function(channel) {
	self.emitVoltage(channel)
    })
}

util.inherits(RobotMonitor, EventEmitter)

RobotMonitor.prototype.emitTemperature = function() {
    var self = this
    var buffer = Buffer([1, 8+0<<4, 0]);
    spi.transfer(buffer, buffer.length, function(error, data) {
	if (error) { console.log(error); }
	else {
	    var value = ((data[1]&3) << 8) + data[2]
	    var temp = ((value * 330)/1023.0)-50
	    self.emit("temp", temp)
	}
	setTimeout(function() {self.emitTemperature()}, 2000)
    });
}

RobotMonitor.prototype.emitVoltage = function(channel) {
    var self = this
    var buffer = Buffer([1, 8+channel<<4, 0]);
    spi.transfer(buffer, buffer.length, function(error, data) {
	if (error) { console.log(error); }
	else {
	    var value = ((data[1]&3) << 8) + data[2]
	    var volts = (value * 3.3) / 1023.0
	    self.emit("volt", channel, volts)
	}
	setTimeout(function() {self.emitVoltage(channel)}, 2000)
    });
};

module.exports.RobotMonitor = RobotMonitor;
