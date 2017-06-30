spm-metrics-js
==============

[SPM Performance Monitoring](http://www.sematext.com/spm/) - Custom Metrics and Event API client for node.js.

This module implements:
 - [custom metrics API](https://sematext.atlassian.net/wiki/display/PUBSPM/Custom+Metrics)  and
 - [events API](https://sematext.atlassian.net/wiki/display/PUBSPM/Events+Integration)

A free account to generate API tokens is available at [www.sematext.com](https://apps.sematext.com/users-web/register.do)

# Installation
```js
    npm install spm-metrics-js
```

# Usage

## Initialize
```
    var SPM = require('spm-metrics-js')
    // YOUR API TOKEN, e.g. from environment variables
    var token =  process.env.SPM_TOKEN
```

Create client object, automatically send every 30 seconds, 0 disables interval transmission.
When transmission interval is disabled metrics are transmitted when the internal buffer size reaches 100 entries.

```js
    var spmClient = new SPM(token, 30000)
```

## Custom Metrics basic usage

Capture relevant metrics for your application and forward it to SPM

```js
    var userMetric = spmClient.getCustomMetric ({name: 'user.count', aggregation: 'avg', filter1: os.hostname()})
    userMetric.set (users.count)
    ...
    userMetric.set (users.count)
```

Force sending the metrics immediately

```js
    spmClient.send()
```

## Custom Metrics advanced usage by utilizing measurements

If you want to apply statistical functions to metrics and send the results to SPM at a fixed interval to SPM,
the metric object should be initialized by declaring an 'interval' for generating the statistics:

```js
      var options = {name: 'requests', aggregation: 'avg', filter1: os.hostname(), interval: 60000}
      var requestCounterMetric = spmClient.getCustomMetric (options)
```
#### List of options

- name - the name of the metric
- aggregation - the aggregation type 'avg', 'sum', 'min' or 'max', defaults to 'avg'
- filter1 - a filter value for the first filter field in SPM User Interface
- filter2 - a filter value for the second filter field in SPM User Interface
- interval - time in ms to call save() periodically. Defaults to no automatic call of save(). The save() function captures the metric and resets meters, histograms, counters or timers.
- valueFilter - Array of property names for calculated values. Only specified fields are sent to SPM.

Measurement functions like histogram(), meter(), timer() add calculated values as properties to the metrics like count, min, max, mean or percentiles. In SPM a metric called "time" might then appear as "time.min", "time.max", "time.mean" etc.

For example: If you want to send only 'count' and 'currentRate' calculated by a "meter" measurement to SPM you can use valueFilter option to limit what you send to SPM:

```js
    var options = {name: 'requests', aggregation: 'avg', filter1: os.hostname(), valueFilter: ['count', 'currentRate']}
```

See details of used properties below.

### Counter

A counter can be incremented and decremented

```js
    var options = {name: 'requests', aggregation: 'avg', filter1: os.hostname(), interval: 60000}
    var userCounterMetric = spmClient.getCustomMetric (options)
    userCounterMetric.counter()
    // use counter e.g. on login
    userCounterMetric.inc()
    // or on logout
    userCounterMetric.dec()
    // save data - only needed if no "interval" is specified
    userCounterMetric.save()
```

### Meter

A meter can be used to count events and calculate rates

```js
    var options = {name: 'requests', aggregation: 'avg', filter1: os.hostname()}
    var requestCounterMetric = spmClient.getCustomMetric (options)
    // activate meter functions
    requestCounterMetric.meter()
    // use meter e.g. in in each request
    requestCounterMetric.mark()
    // save data - only needed if no "interval" is specified
    requestCounterMetric.save()
```

This values will be calculated and attached to your metric:

- mean: The average rate since the meter was started.
- count: The total of all values added to the meter.
- currentRate: The rate of the meter since the meter was started.
- 1MinuteRate: The rate of the meter biased towards the last 1 minute.
- 5MinuteRate: The rate of the meter biased towards the last 5 minutes.
- 15MinuteRate: The rate of the meter biased towards the last 15 minutes.

In our example it would be "requests.mean", "requests.count" etc.

### Histogram

Keeps a resevoir of statistically relevant values biased towards the last 5 minutes to explore their distribution.

```js
        var options = {name: 'requestTime', aggregation: 'avg', filter1: os.hostname()}
        var requestTimeMetric = spmClient.getCustomMetric (options)
        // activate histogram functions
        requestTimeMetric.histogram()
        // use histogram update function e.g. in in each request with measured time
        requestTimeMetric.update(measuredTime)
        // save data and reset histogram - only needed if no "interval" is specified
        var metricValues = requestTimeMetric.save()
        // output values
        console.log (metricValues)
```

This values will be calculated and attached to your metric:

- min: The lowest observed value.
- max: The highest observed value.
- sum: The sum of all observed values.
- variance: The variance of all observed values.
- mean: The average of all observed values.
- stddev: The stddev of all observed values.
- count: The number of observed values.
- median: 50% of all values in the resevoir are at or below this value.
- p75: See median, 75% percentile.
- p95: See median, 95% percentile.
- p99: See median, 99% percentile.
- p999: See median, 99.9% percentile.

In our example it would be "requestTime.min", "requestTime.max", "requestTime.p75"  etc.

### Timer

Timer measures the time between start() and end() call and provides as result properties of Histogram and Meter.

```js
     var timerMetric = spmClient.getCustomMetric (options)
     var stopwatch = timerMetric.timer().start()
     stopwatch.end()
     timerMetric.save()
```

### More Information about the measurement functions

The measurement functions are based on the excellent [Measured](https://github.com/felixge/node-measured) package.
We use a concept of delegate functions to simlify the combined usage of Custom Metrics and Measured. For example a call to metric.histogram() adds dynamically all Measured.Histogram functions to the metrics object created by getCustomMetrics(). The save() function uses toJSON() of the "Measured" objects to generate the calculated properties, which are added to each metric object.

We recommend reading the documentation of [Measured](https://github.com/felixge/node-measured) for a better understanding of the measurement functions. 

## Create Events to correlate events with metrics in SPM

Add an event to SPM Events, the callback function is optional (see events of spm-metrics-js)

```js
    var spmClient = new SPM(token, 0)
    // configure defaults
    var eventLogger = spmClient.getEventLogger ({
            type: 'system',
            name: 'system',
            tags: ['job', 'queue'],
            creator: 'jobsQ.js',
            data: 'String or Base64 coded content'})

    // send Event Message, the callback is optional
    eventLogger.log ('forked new worker', function (err, res) {
        console.log(err || res)
    })

    process.on ('exit', function () {
        eventLogger.log ('Exit job queue PID:' + process.pid)
    })
```


# Monitoring activity and errors

You can add event handlers for errors and actions

```js
    spmClient.on ('error', console.log)
    spmClient.on ('add', console.log)
    spmClient.on ('send metrics', console.log)
    spmClient.on ('send event', console.log)
```

