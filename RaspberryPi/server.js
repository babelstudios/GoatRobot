var util = require('util')
var bleno = require('bleno')
var robot = require('./robot');
var RobotService = require('./robot-service');

var name = "GoatRobot";

bleno.on('stateChange', function(state) {
    if (state === 'poweredOn') {
	bleno.startAdvertising(name, [robotService.uuid], function(err) {
	    console.log('powerOn', name, " ", robotService.uuid);
	    if (err) {
		console.log(err);
	    }
	});
    } else {
	bleno.stopAdvertising();
    }
});

bleno.on('advertisingStart', function(err) {
    if (!err) {
	console.log('advertising...');
	bleno.setServices([
	    robotService
	]);
    }
});


var robotMonitor = require('./robot-monitor')
var monitor = new robotMonitor.RobotMonitor([1, 2, 3, 4])

monitor.on('temp', function(temp) {
    console.log(temp + " C emited")
})

monitor.on('volt', function(channel, volts) {
    console.log(volts + " volts on channel " + channel);
})
