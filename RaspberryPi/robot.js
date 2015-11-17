var servoblaster = require('servoblaster');

function Robot() {
    this.leftMotorStream = servoblaster.createWriteStream(0)
    this.rightMotorStream = servoblaster.createWriteStream(1)
}

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
