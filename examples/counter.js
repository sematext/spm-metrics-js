// app is here a simulator to generate login/logout events
var app = require('./app.js')
var os = require('os')
// load  the module
var SPM = require('../lib/index.js')
// create the SPM Custom Metrics client
var SPM = require('../lib/index.js')
var spmClient = new SPM(process.env.SPM_TOKEN, 20000)
// Create a metrics object to count users
var userCounterMetric = spmClient.getCustomMetric({
  // name of the metric
  name: 'concurrentUser',
  // aggregation type
  aggregation: 'avg',
  // filter in SPM User Interface
  filter1: os.hostname(),
// auto-save metrics in the given interval
interval: 30000})
// use it as 'counter'
var counter = userCounterMetric.counter()
// Hook the counter to your business logic
app.on('login', function (user, password) {counter.inc()})
app.on('logout', function (user) {counter.dec()})
