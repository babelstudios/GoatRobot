var fs = require('fs')

function Configuration(fileName) {
    this.fileName = fileName
}

Configuration.prototype.save = function(key, value) {
    var conf = this.readAll()
    conf[key] = value
    this.saveAll(conf)
}

Configuration.prototype.read = function(key) {
    var conf = this.readAll()
    return conf[key]
}

Configuration.prototype.saveAll = function(settings) {
    var data = JSON.stringify(settings)
    fs.writeFileSync(this.fileName, data)
}

Configuration.prototype.readAll = function() {
    try {
	var data = fs.readFileSync(this.fileName)
	var settings = JSON.parse(data)
	return settings
    } catch (error) {
	console.log('Error reading configuration. Reset configuration.')
	this.saveAll({})
	return ({})
    }
}

module.exports.Configuration = Configuration
