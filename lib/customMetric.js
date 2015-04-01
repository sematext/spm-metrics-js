var Measured = require('measured')
var delegate = require('delegate')
var extend = require('extend')

/**
 *
 * @param options  name, aggregation ('avg'|'sum'|'min'|'max'),filter1,filter2, aggregationMap {count: 'sum', min: 'min'}
 * @param spm and instance of spm-metrics-js
 * @constructor
 */
var CustomMetric = function CustomMetric (options, spm) {
  this.options = options
  this.spm = spm
  this.value = 0
  this.collection = Measured.createCollection()
  this.stats = new Measured.Gauge(function () { return this.value})
  if (!this.options.aggregationMap) {
    this.options.aggregationMap = {default: 'avg', count: 'sum', mean: 'avg', median: 'avg', currentRate: 'avg', '1MinuteRate': 'avg'}
  }
  delegate(this, this.measured)
  if (options instanceof String) {
    this.options = { name: options }
  }
  if (this.options.interval > 0) {
    this.tid = setInterval(this.save, this.options.interval)
    this.tid.unref()
  }
}

/**
 * Sets the value of the metric (name specified in constructor/options)
 * @param value
 */
CustomMetric.prototype.set = function (value, property) {
  this.value = value
  var metricName = this.options.name
  if (property) {
    metricName = metricName + '.' + property
  }
  this.spm.add(metricName,
    value, this.options.aggregationMap[property || 'default'] || 'avg',
    this.options.filter1 || 'filter1',
    this.options.filter2 || 'filter2')
}

CustomMetric.prototype.save = function () {
  var m = 0
  if (this.stats.toJSON) {
    m = this.stats.toJSON()
  } else {
    throw new Error('Object has no method toJSON()')
  }
  var values = {}
  if (!(m instanceof Number)) {
    if (m.hasOwnProperty('meter') && m.hasOwnProperty('histogram')) {
      values = extend(values, m.histogram)
      values = extend(values, m.meter)
    } else {
      values = m
    }
    for (var key in values) {
      if (this.options.valueFilter instanceof Array) {
        if (this.options.valueFilter.indexOf(key) >= 0) {
          this.set(values[key], key)
        }
      } else {
        this.set(values[key], key)
      }
    }
  } else {
    this.set(values)
  }
  if (this.stats.reset) {
    this.stats.reset()
  }
  return values
}

CustomMetric.prototype.use = function (measuredType, initValues) {
  this.usedMeasure = measuredType
  this.stats = measuredType.call(this.collection, this.options.name, initValues)
  delegate(this, this.stats)
  if (this.stats.unref) {
    this.stats.unref()
  }
  return this.stats
}

CustomMetric.prototype.meter = function () {
  return this.use(this.collection.meter)
}

CustomMetric.prototype.histogram = function () {
  return this.use(this.collection.histogram)
}

CustomMetric.prototype.timer = function () {
  return this.use(this.collection.timer)
}

CustomMetric.prototype.counter = function (initValue) {
  return this.use(this.collection.counter, {count: initValue})
}

CustomMetric.prototype.clearInterval = function () {
  if (this.tid) {
    clearInterval(this.tid)
  }
}

module.exports = CustomMetric
