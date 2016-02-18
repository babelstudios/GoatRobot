var util = require('util');
var EventEmitter = require('events').EventEmitter;
var sylvester = require('sylvester'),
    Matrix = sylvester.Matrix,
    Vector = sylvester.Vector;

var ACC_WEIGHT = 0.02
var MAG_WEIGHT = 0.02

function DCMFilter(dataProvider) {
    var self = this
    this.stabilizing = 20
    this.dataProvider = dataProvider
    this.dcmEst = Matrix.create([[1,0,0],
				 [0,1,0],
				 [0,0,1]])
    
    this.dataProvider.on('data', function(sensorData) {
	self.updateFilter(sensorData, function(dcm) {
	    self.toRollPitchYaw(dcm, function(rollPitchYaw) {
		self.emit('data', rollPitchYaw)
	    })
	})
    })
}

util.inherits(DCMFilter, EventEmitter)

DCMFilter.prototype.updateFilter = function(data, callback) {
    // Accellerometer
    var kAcc = Vector.create(data.acc).multiply(-1.0).toUnitVector()
    var wA = this.dcmEst.row(3).cross(kAcc)
	    
    // Magnetometer
    var iMag = Vector.create([data.mag[0], data.mag[1], -data.mag[2]]).toUnitVector().multiply(1.0)
    var iMagNorth = kAcc.cross(iMag).cross(kAcc).toUnitVector()
    var wM = this.dcmEst.row(1).cross(iMagNorth)
//    var iMag = Vector.create([Math.sqrt(1-this.dcmEst.e(1, 3)*this.dcmEst.e(1,3)), 0, this.dcmEst.e(1,3)])
//    var wM = this.dcmEst.row(1).cross(iMag)

    // Gyro
    var wG = Vector.create(data.gyro).multiply(-1.0)
    var accWeight = ACC_WEIGHT
    var magWeight = MAG_WEIGHT

    if(this.stabilizing > 0) {
	this.stabilizing--
	var accWeight = 1000
	var magWeight = 1000
    }

    // Create rotation vector
    var w = wG.add(wA.multiply(accWeight)).add(wM.multiply(magWeight))
    w = w.multiply(1.0 / (1.0 + accWeight + magWeight)) 

    // Rotate DCM matrix
    var dR = Matrix.create([w.cross(this.dcmEst.row(1)).elements,
			    w.cross(this.dcmEst.row(2)).elements,
			    w.cross(this.dcmEst.row(3)).elements])
    var dcm = this.dcmEst.add(dR)
    
    // Make DCM orthonormal
    var error = dcm.row(1).dot(dcm.row(2))
    var deltaI = dcm.row(2).multiply(-error/2.0)
    var deltaJ = dcm.row(1).multiply(-error/2.0)
    var dcmNorth = dcm.row(1).add(deltaI)
    var dcmWest = dcm.row(2).add(deltaJ)
    var dcmZenit = dcmNorth.cross(dcmWest).toUnitVector()
    dcmNorth = dcmNorth.toUnitVector()
    dcmWest = dcmWest.toUnitVector()
    this.dcmEst = Matrix.create([dcmNorth.elements,
				 dcmWest.elements,
				 dcmZenit.elements])
    callback(this.dcmEst)
}

DCMFilter.prototype.toRollPitchYaw = function(dcm, callback) {
    var x = this.dcmEst.e(2, 2)
    var y = -this.dcmEst.e(1, 2)
    var yaw = Math.atan2(y, x)
    
    x = this.dcmEst.e(3, 3)
    y = -this.dcmEst.e(3, 1)
    var roll = Math.atan2(y, x)
    
    y = -this.dcmEst.e(3, 2)
    var pitch = Math.atan2(y, x)
    callback({roll: roll, pitch: pitch, yaw: yaw})
}

module.exports.DCMFilter = DCMFilter;
