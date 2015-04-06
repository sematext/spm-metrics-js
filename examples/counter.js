// app is here a simulator to generate login/logout events
var app = require('./app.js')
var os = require('os')
// load  the module
var SPM = require('../lib/index.js')
// create the SPM Custom Metrics client
var spmClient = new SPM(process.env.SPM_TOKEN, 1000)
spmClient.on ('error', console.log)
spmClient.on('send metrics', console.log)
// Create a metrics object to count users
var userCounterMetric = spmClient.getCustomMetric({
  // name of the metric
  name: 'user',
  // aggregation type
  aggregation: 'avg',
  // filter in SPM User Interface
  filter1: os.hostname(),
// auto-save metrics in the given interval
interval: 10000})
// use it as 'counter'
userCounterMetric.counter()
// Hook the counter to your business logic
app.on('login', function (user, password) {userCounterMetric.inc()})
app.on('logout', function (user) {userCounterMetric.dec()})
