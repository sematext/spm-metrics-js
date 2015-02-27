var extend = require('extend')

var EventLogger = function EventLogger(options, spm) {
    this.options = options
    this.spm = spm
}


EventLogger.prototype.log = function (message, callback) {
    var msg = extend({message: message}, this.options)
    this.spm.sendEvent(this.options.type || 'event', msg, callback)
}

module.exports = EventLogger