var Measured = require('measured')
var util = require ('util')
var delegate = require ('delegate')
var extend = require ('extend')

/**
 *
 * @param options   name, aggregation ('avg'|'sum'|'min'|'max'),filter1,filter2
 * @param spm and instance of spm-metrics-js
 * @constructor
 */
var CustomMetric = function CustomMetric (options, spm) {
  this.options = options
  this.spm = spm
  this.value = 0
  this.stats = new Measured.Gauge(function () { return this.value})
  delegate(this, this.measured)
  if (options instanceof String) {
    this.options = { name: options }
  }
  if (this.options.interval>0)
  {
     this.tid = setInterval (this.save, this.options.interval)
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
  if (property)
  {
    metricName = metricName + '.' + property
  }
  this.spm.add(metricName, value,
    this.options.aggregation || 'avg',
    this.options.filter1 || 'filter1',
    this.options.filter2 || 'filter2')
}

CustomMetric.prototype.save = function () {
  var m = this.stats.toJSON()
  var values = {}
  if (m instanceof Object)
  {
    if (m.meter && m.histogram)
    {
        values = extend(values, m.meter)
        values = extend(values, m.histogram)
    } else {
      values = m
    }
    for (var key in values)
    {
      if (this.options.valueFilter instanceof Array)
      {
        if (this.options.valueFilter.indexOf(key) >= 0)
          this.set (values[key], key)
      } else {
        this.set (values[key], key)
      }
    }
    if (this.stats.reset)
      this.stats.reset()
  } else {
    this.set(values)
  }
  return values
}

CustomMetric.prototype.use = function (measured) {
  this.stats = measured
  delegate(this, measured)
  if (this.stats.unref)
    this.stats.unref()
  return this.stats
}

CustomMetric.prototype.meter = function () {
  return this.use(new Measured.Meter())
}

CustomMetric.prototype.histogram = function () {
  return this.use(new Measured.Histogram())
}

CustomMetric.prototype.timer = function () {
  return this.use(new Measured.Timer())
}

CustomMetric.prototype.counter = function () {
  return this.use(new Measured.Counter())
}

CustomMetric.prototype.cancelInterval = function () {
   if (this.tid)
     cancelInterval(tid)
}

module.exports = CustomMetric
