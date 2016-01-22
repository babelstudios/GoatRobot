var SPI = require('pi-spi')
var spi = SPI.initialize('/dev/spidev0.0')
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function RobotMonitor(voltageChannels) {
    this.emitTemperatureLoop()
    this.voltageChannels = voltageChannels
    this.emitVoltageLoop()
}

util.inherits(RobotMonitor, EventEmitter)

RobotMonitor.prototype.emitTemperatureLoop = function() {
    var self = this
    var buffer = Buffer([1, 8+7<<4, 0]);
    spi.transfer(buffer, buffer.length, function(error, data) {
	if (error) { console.log(error); }
	else {
	    var value = ((data[1]&3) << 8) + data[2]
	    var temp = ((value * 330)/1023.0)-50
	    self.emit("temperature", temp)
	}
	setTimeout(function() {self.emitTemperatureLoop()}, 5000)
    });
}

RobotMonitor.prototype.readVoltageChannels = function(channels, result, callback) {
    var self = this
    var channel = channels.shift()
    var buffer = Buffer([1, 8+channel<<4, 0])
    spi.transfer(buffer, buffer.length, function(error, data) {
	if (error) {
	    console.log(error)
	    callback([])
	} else {
	    var value = ((data[1]&3) << 8) + data[2]
	    var volts = (value * 3.3) / 1023.0
	    result.push([channel, volts])
	    if (channels.length) {
		self.readVoltageChannels(channels, result, callback)
	    } else {
		callback(result)
	    }
	}
    })
}

RobotMonitor.prototype.emitVoltageLoop = function() {
    var self = this
    var channels = this.voltageChannels.slice()
    this.readVoltageChannels(channels, [], function(result) {
	self.emit("voltage", result)
	setTimeout(function() {self.emitVoltageLoop()}, 5000)
    })
};

module.exports.RobotMonitor = RobotMonitor;
