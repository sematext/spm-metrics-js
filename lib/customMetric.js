/**
 *
 * @param options   name, aggregation ('avg'|'sum'|'min'|'max'),filter1,filter2
 * @param spm and instance of spm-metrics-js
 * @constructor
 */
var CustomMetric = function CustomMetric (options, spm) {
  this.options = options
  this.spm = spm
  if (options instanceof String) {
    this.options = { name: options }
  }
}

/**
 * Sets the value of the metric (name specified in constructor/options)
 * @param value
 */
CustomMetric.prototype.set = function (value) {
  this.spm.add(this.options.name, value,
    this.options.aggregation || 'avg',
    this.options.filter1 || 'filter1',
    this.options.filter2 || 'filter2')
}

module.exports = CustomMetric
