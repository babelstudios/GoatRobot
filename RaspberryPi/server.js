var util = require('util')

var LSM9DS0 = require('./lsm9ds0')
var lsm9ds0 = new LSM9DS0.LSM9DS0(100.0);
lsm9ds0.start()
//console.log('Calculating gyro bias...')

/*
lsm9ds0.calibrateMag(40*1000, function() {
    console.log('Calibration done.')
    lsm9ds0.start()
    lsm9ds0.on('data', function(data) {
	console.log(data.mag)
    })
})
*/

var DCMFilter = require('./dcm-filter')
var dcmFilter = new DCMFilter.DCMFilter(lsm9ds0)
dcmFilter.on('data', function(data) {
    console.log("roll: " + (data.roll * 180 / Math.PI).toFixed(2) + ", pitch: " + (data.pitch * 180 / Math.PI).toFixed(2) + ", yaw: " + (data.yaw * 180 / Math.PI).toFixed(2))
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

/*
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
*/

