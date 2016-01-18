var i2c = require('i2c');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var sylvester = require('sylvester'),
    Matrix = sylvester.Matrix,
    Vector = sylvester.Vector;
var Configuration = require('./configuration')

function LSM9DS0(looptime) {
    var self = this
    this.looptime = looptime
    this.configuration = new Configuration.Configuration('settings.json')

    // Accellerometer and mag wire
    this.xm = new i2c(0x1d, {device: '/dev/i2c-1'});
    // z,y,x axis enabled, continuos update,  100Hz data rate
    this.xm.writeBytes(LSM9DS0.CTRL_REG1_XM, [0x67], function(err){});
    // 6G scale
    this.xm.writeBytes(LSM9DS0.CTRL_REG2_XM, [0x10], function(err){});
    
    // initialize mag    
    this.xm.writeBytes(LSM9DS0.CTRL_REG5_XM, [0xF0], function(err){});
    this.xm.writeBytes(LSM9DS0.CTRL_REG6_XM, [0x60], function(err){});
    this.xm.writeBytes(LSM9DS0.CTRL_REG7_XM, [0x00], function(err){});
    this.magCalibration = this.configuration.read('magCalibration')
    if (!this.magCalibration) {
	this.magCalibration = {xMax: 0, xMin: 0, yMax: 0, yMin: 0, zMax: 0, zMin: 0}
	this.configuration.save('magCalibration', this.magCalibration)
    }

    // Accellerometer wire
    this.gyro = new i2c(0x6b, {device: '/dev/i2c-1'});
    // initialize gyro
    this.gyro.writeBytes(LSM9DS0.CTRL_REG1_G, [0x0F], function(err){});
    this.gyro.writeBytes(LSM9DS0.CTRL_REG4_G, [0x30], function(err){});
    this.gyroBias = [0, 0, 0]
}

util.inherits(LSM9DS0, EventEmitter)

LSM9DS0.prototype.start = function() {
    var self = this
    self.calculateGyroBias(0, [0,0,0], function() {
	self.time = process.hrtime();
	self.emitData()
    })
}

LSM9DS0.prototype.emitData = function() {
    var self = this
    self.readGyro(function(gyroData) {
	self.readAcc(function(accData) {
	    self.readMag(function(magData) {
		var dt = process.hrtime(self.time)[1] / 1000000000.0;
		self.time = process.hrtime()
		gyroData = [gyroData[0] * dt, gyroData[1] * dt, gyroData[2] * dt]
		self.emit('data', {gyro: gyroData, acc: accData, mag: magData, dt: dt})
		setTimeout(function() {self.emitData()}, self.looptime)		
	    })
	})
    })
}

LSM9DS0.prototype.calculateGyroBias = function(counter, bias, callback) {
    var self = this
    this.readGyro(function(data) {
	counter++;
	if (counter > 5) {
	    bias[0] += data[0]
	    bias[1] += data[1]
	    bias[2] += data[2]
	}
	if (counter > 20) {
	    self.gyroBias[0] = bias[0] / (counter - 5)
	    self.gyroBias[1] = bias[1] / (counter - 5)
	    self.gyroBias[2] = bias[2] / (counter - 5)
	    callback()
	    return
	}
	setTimeout(function() {self.calculateGyroBias(counter, bias, callback)}, self.looptime)
    })
}

LSM9DS0.prototype.calibrateMag = function(time, callback) {
    var calibration = this.configuration.read('magCalibration')
    this.magCalibration = {xMax: 0, xMin: 0, yMax: 0, yMin: 0, zMax: 0, zMin: 0}
    this.calibrateMagLoop(time, calibration, callback)
}

LSM9DS0.prototype.calibrateMagLoop = function(time, calibration, callback) {
    var self = this
    this.readMag(function(data) {
	time -= 100.0
	if (data[0] > calibration.xMax) {
	    calibration.xMax = data[0]
	}
	if (data[0] < calibration.xMin) {
	    calibration.xMin = data[0]
	}
	if (data[1] > calibration.yMax) {
	    calibration.yMax = data[1]
	}
	if (data[1] < calibration.yMin) {
	    calibration.yMin = data[1]
	}
	if (data[2] > calibration.zMax) {
	    calibration.zMax = data[2]
	}
	if (data[2] < calibration.zMin) {
	    calibration.zMin = data[2]
	}
	console.log(calibration)
	console.log(time/1000)

	if(time <= 0) {
	    self.magCalibration = calibration
	    self.configuration.save('magCalibration', calibration)
	    callback()
	    return
	}
	
	setTimeout(function() {self.calibrateMagLoop(time, calibration, callback)}, 100.0)
    })
}

LSM9DS0.prototype.readGyro = function(callback) {
    var self = this
    this.gyro.readBytes(0x80 | LSM9DS0.OUT_X_L_G, 6, function(error, data) {
	var x = (data.readInt16LE(0) * 0.07 * Math.PI / 180.0) - self.gyroBias[0];
	var y = (data.readInt16LE(2) * 0.07 * Math.PI / 180.0) - self.gyroBias[1];
	var z = (data.readInt16LE(4) * 0.07 * Math.PI / 180.0) - self.gyroBias[2];
	callback([x, y, z]);
    });
};

LSM9DS0.prototype.readAcc = function(callback) {
    this.xm.readBytes(0x80 | LSM9DS0.OUT_X_L_A, 6, function(error, data) {
	var x = data.readInt16LE(0);
	var y = data.readInt16LE(2);
	var z = data.readInt16LE(4);
	callback([x, y, z]);
    });
};

LSM9DS0.prototype.readMag = function(callback) {
    var self = this
    this.xm.readBytes(0x80 | LSM9DS0.OUT_X_L_M, 6, function(error, data) {
	var cal = self.magCalibration
	var x = data.readInt16LE(0) - (cal.xMin + cal.xMax) / 2 - cal.xMin / (cal.xMax - cal.xMin) * 2 - 1
	var y = data.readInt16LE(2) - (cal.yMin + cal.yMax) / 2 - cal.yMin / (cal.yMax - cal.yMin) * 2 - 1
	var z = data.readInt16LE(4) - (cal.zMin + cal.zMax) / 2 - cal.zMin / (cal.zMax - cal.zMin) * 2 - 1
	callback([x, y, z]);
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


LSM9DS0.OUT_TEMP_L_XM = 0x05;
LSM9DS0.OUT_TEMP_H_XM = 0x06;
LSM9DS0.STATUS_REG_M = 0x07;
LSM9DS0.OUT_X_L_M = 0x08;
LSM9DS0.OUT_X_H_M = 0x09;
LSM9DS0.OUT_Y_L_M = 0x0A;
LSM9DS0.OUT_Y_H_M = 0x0B;
LSM9DS0.OUT_Z_L_M = 0x0C;
LSM9DS0.OUT_Z_H_M = 0x0D;
LSM9DS0.WHO_AM_I_XM = 0x0F;
LSM9DS0.INT_CTRL_REG_M = 0x12;
LSM9DS0.INT_SRC_REG_M = 0x13;
LSM9DS0.INT_THS_L_M = 0x14;
LSM9DS0.INT_THS_H_M = 0x15;
LSM9DS0.OFFSET_X_L_M = 0x16;
LSM9DS0.OFFSET_X_H_M = 0x17;
LSM9DS0.OFFSET_Y_L_M = 0x18;
LSM9DS0.OFFSET_Y_H_M = 0x19;
LSM9DS0.OFFSET_Z_L_M = 0x1A;
LSM9DS0.OFFSET_Z_H_M = 0x1B;
LSM9DS0.REFERENCE_X = 0x1C;
LSM9DS0.REFERENCE_Y = 0x1D;
LSM9DS0.REFERENCE_Z = 0x1E;
LSM9DS0.CTRL_REG0_XM = 0x1F;
LSM9DS0.CTRL_REG1_XM = 0x20;
LSM9DS0.CTRL_REG2_XM = 0x21;
LSM9DS0.CTRL_REG3_XM = 0x22;
LSM9DS0.CTRL_REG4_XM = 0x23;
LSM9DS0.CTRL_REG5_XM = 0x24;
LSM9DS0.CTRL_REG6_XM = 0x25;
LSM9DS0.CTRL_REG7_XM = 0x26;
LSM9DS0.STATUS_REG_A = 0x27;
LSM9DS0.OUT_X_L_A = 0x28;
LSM9DS0.OUT_X_H_A = 0x29;
LSM9DS0.OUT_Y_L_A = 0x2A;
LSM9DS0.OUT_Y_H_A = 0x2B;
LSM9DS0.OUT_Z_L_A = 0x2C;
LSM9DS0.OUT_Z_H_A = 0x2D;
LSM9DS0.FIFO_CTRL_REG = 0x2E;
LSM9DS0.FIFO_SRC_REG = 0x2F;
LSM9DS0.INT_GEN_1_REG = 0x30;
LSM9DS0.INT_GEN_1_SRC = 0x31;
LSM9DS0.INT_GEN_1_THS = 0x32;
LSM9DS0.INT_GEN_1_DURATION = 0x33;
LSM9DS0.INT_GEN_2_REG = 0x34;
LSM9DS0.INT_GEN_2_SRC = 0x35;
LSM9DS0.INT_GEN_2_THS = 0x36;
LSM9DS0.INT_GEN_2_DURATION = 0x37;
LSM9DS0.CLICK_CFG = 0x38;
LSM9DS0.CLICK_SRC = 0x39;
LSM9DS0.CLICK_THS = 0x3A;
LSM9DS0.TIME_LIMIT = 0x3B;
LSM9DS0.TIME_LATENCY = 0x3C;
LSM9DS0.TIME_WINDOW = 0x3D;
LSM9DS0.ACT_THS = 0x3E;
LSM9DS0.ACT_DUR = 0x3F;

module.exports.LSM9DS0 = LSM9DS0;
