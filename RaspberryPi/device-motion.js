var i2c = require('i2c');
var address = 0x18;
var wire = new i2c(address, {device: '/dev/i2c-1'});

wire.scan(function(err, data) {
    console.log(data)
    console.log(err)
})

// button is attaced to pin 17, led to 18
var GPIO = require('onoff').Gpio,
    led = new GPIO(18, 'out'),
    button = new GPIO(17, 'in', 'both');

console.log("test")

// define the callback function
function light(err, state) {

    // check the state of the button
    // 1 == pressed, 0 == not pressed
    if(state == 1) {
	// turn LED on
	led.writeSync(1);
    } else {
	// turn LED off
	led.writeSync(0);
    }

}

// pass the callback function to the
// as the first argument to watch()
button.watch(light);
