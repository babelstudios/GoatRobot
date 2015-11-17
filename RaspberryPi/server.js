var util = require('util')
var bleno = require('bleno')
var robot = require('./robot');
var RobotService = require('./robot-service');

var name = "GoatRobot";
var robotService = new RobotService(new robot.Robot());

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
