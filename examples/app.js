var events = require('events')
var util = require('util')
var loggedIn = 0
function DemoApp () {
  var self = this
  events.EventEmitter.call(this)
  setInterval(function () {
    var count = Math.round(Math.random() * 20 + 1)
    for (var i = 0; i < count; i++) {
      setTimeout(function () { self.emit('login', 'test')}, 0)
    }
    loggedIn = count
  // console.log ('login ' + count)
  }, 1000)
  setInterval(function () {
    var count = Math.round(Math.random() * 18 + 1)
    for (var i = 0; i < Math.min(loggedIn, count); i++) {
      setTimeout(function () { self.emit('logout', 'test')}, 0)
    }
  // console.log ('logout ' + count)
  }, 1000)
}
util.inherits(DemoApp, events.EventEmitter)
module.exports = new DemoApp()
