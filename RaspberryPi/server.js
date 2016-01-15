var util = require('util')

var LSM9DS0 = require('./lsm9ds0')
var lsm9ds0 = new LSM9DS0.LSM9DS0();

console.log(lsm9ds0);

lsm9ds0.on('gyro', function(x) {
    console.log(x);
});


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


var Bancroft = require('bancroft');
var bancroft = new Bancroft();

bancroft.on('connect', function () {
    console.log('connected');
});
bancroft.on('location', function (location) {
    console.log('got new location');
    console.log(location);
});
//bancroft.on('satellite', function (satellite) {
//    console.log('got new satellite state');
//});
bancroft.on('disconnect', function (err) {
    console.log('disconnected');
});


var robotMonitor = require('./robot-monitor')
var monitor = new robotMonitor.RobotMonitor([1, 2])

monitor.on('temp', function(temp) {
    console.log(temp + " C emited")
})

monitor.on('volt', function(channel, volts) {
    console.log(volts + " volts on channel " + channel);
})

