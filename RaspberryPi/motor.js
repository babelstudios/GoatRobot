//var util = require('util');

function Motor() {
    console.log('create motor');
    this.foo = 0;
}

Motor.prototype.throttle = function(throttle) {
//    this.throttle = throttle;
    console.log('set throttle to ', throttle);
};

module.exports.Motor = Motor;
