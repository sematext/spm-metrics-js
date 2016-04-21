'use strict'

var MAX_DP = 99
var request = require('request')
var events = require('events')
var extend = require('extend')
var EventLogger = require('./eventLogger.js')
var CustomMetric = require('./customMetric.js')
var util = require('util')
/**
 *
 * @param {string} token - your token for your app (created in SPM UI)
 * @param {int} metricsInterval - 0 disabled, >0 interval in milliseconds to send metrics, if this is set to 0 metrics are send when 100 data points are collected
 * @param {string} metricsApiEndpoint - default value is 'http://spm-receiver.sematext.com/receiver/custom/receive.json?token='
 * @constructor
 */
function SpmCustomMetrics (token, metricsInterval, metricsApiEndpoint) {
  if(process.env.SPM_RECEIVER_URL) {
    this.metricsUrl = process.env.SPM_RECEIVER_URL.replace('_bulk', 'receiver/custom/receive.json?token=' + token)
  } else {
    this.metricsUrl = (metricsApiEndpoint || 'https://spm-receiver.sematext.com/receiver/custom/receive.json?token=') + token  
  }
  this.token = token || process.env.SPM_TOKEN
  this.datapoints = []
  this.logs = []
  events.EventEmitter.call(this)
  var self = this
  if (metricsInterval > 0) {
    setInterval(function () {
      self.send()
    }, Math.max(metricsInterval, 30000))
  }
}
util.inherits(SpmCustomMetrics, events.EventEmitter)

/**
 * Adds a data point to the metrics array
 * Data structure according to https://sematext.atlassian.net/wiki/display/PUBSPM/Custom+Metrics
 * @param {string[]} name
 * @param {string} value
 * @param {string} aggregation (avg,sum,min,max)
 * @param {string} filter1
 * @param {string} filter2
 */
SpmCustomMetrics.prototype.add = function (name, value, aggregation, filter1, filter2) {
  var dp = {
    timestamp: (new Date().getTime()),
    name: name,
    value: value,
    aggregation: aggregation,
    filter1: filter1,
    filter2: filter2
  }
  this.datapoints.push(dp)
  // SPM is accepting maximum 100 datapoints in one request
  // we need to send it if we reach this number
  this.emit('add', dp)
  if (this.datapoints.length === MAX_DP) {
    this.send()
  }
}

/**
 * Sending collected data points to SPM
 * fires event 'error' and event 'metrics'
 */
SpmCustomMetrics.prototype.send = function () {
  if (this.datapoints.length == 0)
  {
    return
  }
  var options = {
    url: this.metricsUrl,
    headers: {
      'User-Agent': 'spm-metrics-js',
      'Content-Type': 'application/json',
      'Origin': 'https://spm-receiver.sematext.com/'
    // 'Keep-Alive': false
    },
    body: JSON.stringify({ datapoints: this.datapoints }),
    method: 'POST'
  }
  this.datapoints = []
  var self = this
  request.post(options, function (err, res) {
    if (err) {
      self.emit('send error', err)
    } else {
      self.emit('send metrics', { res: res, source: 'send' })
    }
  }).on('error', function (err) {
    self.emit('send error', err)
  })
}

/**
 * Sends an event to SPM - please note this function is called from "logEvent"
 * @param type type of the event
 * @param event SPM Event - an Object with at least "timestamp" as ISO String and "message"
 */
SpmCustomMetrics.prototype.sendEvent = function (type, event, callback) {
  var msg = {
    timestamp: new Date().toISOString()
  }
  msg = extend(msg, event)
  var options = {
    url: (process.env.EVENTS_RECEIVER_URL || 'https://event-receiver.sematext.com') + '/' + this.token + '/' + type,
    headers: {
      'User-Agent': 'spm-metrics-js',
      'Content-Type': 'application/json'
    // 'Keep-Alive': false
    },
    body: JSON.stringify(event),
    method: 'POST'
  }
  this.events = []
   request.post(options, function (err, res) {
      if (callback) {
        return callback(err, res)
      }
      if (err) {
        self.emit('send error', {  err: err, source: 'sendEvent'})
      } else {
        self.emit('send event', { source: 'sendEvent', event: event, err: err })
      }
    }) 
}

/**
 * Adds an Event to SPM
 * Data structure according to https://sematext.atlassian.net/wiki/display/PUBSPM/Custom+Metrics
 * @param {string} type of event
 * @param {string} priority/level
 * @param {string} message
 * @param {string} name of the event
 * @param {string} creator
 * @param {string} data (base64 if binary)
 */
SpmCustomMetrics.prototype.logEvent = function (type, priority, message, name, tags, creator, data, callback) {
  var event = {
    timestamp: new Date().toISOString(),
    priority: priority,
    message: message,
    name: name,
    tags: tags,
    creator: creator,
    data: data
  }
  this.sendEvent(type, event, callback)
}

/**
 *
 * @param defaults - {type, priority, message, name, tags, creator, data(string|base64)}
 * @returns {EventLogger}
 */
SpmCustomMetrics.prototype.getEventLogger = function (defaults) {
  return new EventLogger(defaults, this)
}
/**
 *
 * @param defaults - {name, aggregation ('avg'|'sum'|'min'|'max'), filter1, filter2}
 * @returns {CustomMetric}
 */
SpmCustomMetrics.prototype.getCustomMetric = function (defaults) {
  return new CustomMetric(defaults, this)
}

module.exports = SpmCustomMetrics
