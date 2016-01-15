var i2c = require('i2c');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function LSM9DS0() {
    var self = this
    
    this.acc = new i2c(0x1d, {device: '/dev/i2c-1'});
    
    // initialize gyro
    this.gyro = new i2c(0x6b, {device: '/dev/i2c-1'});
    this.gyro.writeBytes(LSM9DS0.CTRL_REG1_G, [0x0F], function(err){});
    this.gyro.writeBytes(LSM9DS0.CTRL_REG4_G, [0x30], function(err){});
    this.gyroBias = 0
    
    this.time = process.hrtime();
    self.calculateGyroBias(0, function() {
	self.emitGyro();
    })
}

util.inherits(LSM9DS0, EventEmitter)

LSM9DS0.prototype.calculateGyroBias = function(counter, callback) {
    var self = this
    this.readGyro(function(data) {
	var dt = process.hrtime(self.time)[1] / 1000000000.0;
	self.time = process.hrtime()
//	console.log("Calculating bias\nx: " + (data.x * dt) + ", bias: " + self.gyroBias + ", dt: " + dt);
	var x = data.x * dt;
	counter++;
	if (counter > 5) {
	    self.gyroBias += x
	}
	if (counter > 30) {
	    self.gyroBias = self.gyroBias / (counter - 5)
	    callback()
	    return
	}
	setTimeout(function() {self.calculateGyroBias(counter, callback)}, 100.0)	
    })
}

LSM9DS0.prototype.emitGyro = function() {
    var self = this;
    this.readGyro(function(data) {
	var dt = process.hrtime(self.time)[1] / 1000000000.0;
	self.time = process.hrtime()
//	console.log("x: " + (data.x * dt) + ", bias: " + self.gyroBias + ", corrected: " + (data.x * dt - self.gyroBias) + ", dt: " + dt);
	var x = data.x * dt - self.gyroBias
	self.emit("gyro", x)
	setTimeout(function() {self.emitGyro()}, 100.0)
    })
}

LSM9DS0.prototype.readGyro = function(callback) {
    this.gyro.readBytes(0x80 | LSM9DS0.OUT_X_L_G, 6, function(error, data) {
	var x = data.readInt16LE(0) * 0.07;
	var y = data.readInt16LE(2) * 0.07;
	var z = data.readInt16LE(4) * 0.07;
	callback({'x':x, 'y':y, 'z':z});
    });
};



LSM9DS0.WHO_AM_I_G = 0x0F;
LSM9DS0.CTRL_REG1_G = 0x20;
LSM9DS0.CTRL_REG2_G = 0x21;
LSM9DS0.CTRL_REG3_G = 0x22;
LSM9DS0.CTRL_REG4_G = 0x23;
LSM9DS0.CTRL_REG5_G = 0x24;
LSM9DS0.REFERENCE_G = 0x25;
LSM9DS0.STATUS_REG_G = 0x27;
LSM9DS0.OUT_X_L_G = 0x28;
LSM9DS0.OUT_X_H_G = 0x29;
LSM9DS0.OUT_Y_L_G = 0x2A;
LSM9DS0.OUT_Y_H_G = 0x2B;
LSM9DS0.OUT_Z_L_G = 0x2C;
LSM9DS0.OUT_Z_H_G = 0x2D;
LSM9DS0.FIFO_CTRL_REG_G = 0x2E;
LSM9DS0.FIFO_SRC_REG_G = 0x2F;
LSM9DS0.INT1_CFG_G = 0x30;
LSM9DS0.INT1_SRC_G = 0x31;
LSM9DS0.INT1_THS_XH_G = 0x32;
LSM9DS0.INT1_THS_XL_G = 0x33;
LSM9DS0.INT1_THS_YH_G = 0x34;
LSM9DS0.INT1_THS_YL_G = 0x35;
LSM9DS0.INT1_THS_ZH_G = 0x36;
LSM9DS0.INT1_THS_ZL_G = 0x37;
LSM9DS0.INT1_DURATION_G = 0x38;

LSM9DS0.G_SCALE_245DPS = 0;  // 245 degrees per second
LSM9DS0.G_SCALE_500DPS = 1;  // 500 dps
LSM9DS0.G_SCALE_2000DPS = 2; // 2000 dps

LSM9DS0.G_ODR_95_BW_125 = 0x0;  //   95         12.5
LSM9DS0.G_ODR_95_BW_25 = 0x1;   //   95          25

// 0x2 and 0x3 define the same data rate and bandwidth
LSM9DS0.G_ODR_190_BW_125 = 0x4; //   190        12.5
LSM9DS0.G_ODR_190_BW_25 = 0x5;  //   190         25
LSM9DS0.G_ODR_190_BW_50 = 0x6;  //   190         50
LSM9DS0.G_ODR_190_BW_70 = 0x7;  //   190         70
LSM9DS0.G_ODR_380_BW_20 = 0x8;  //   380         20
LSM9DS0.G_ODR_380_BW_25 = 0x9;  //   380         25
LSM9DS0.G_ODR_380_BW_50 = 0xA;  //   380         50
LSM9DS0.G_ODR_380_BW_100 = 0xB; //   380         100
LSM9DS0.G_ODR_760_BW_30 = 0xC;  //   760         30
LSM9DS0.G_ODR_760_BW_35 = 0xD;  //   760         35
LSM9DS0.G_ODR_760_BW_50 = 0xE;  //   760         50
LSM9DS0.G_ODR_760_BW_100 = 0xF; //   760         100


module.exports.LSM9DS0 = LSM9DS0;
