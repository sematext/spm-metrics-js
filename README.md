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

If you like to use this measurement functions and want to send the statistics in a regular period of time to SPM,
the metric object should be initialized by declaring an 'interval' for generating the statistics:

```js
      var options = {name: 'requests', aggregation: 'avg', filter1: os.hostname(), interval: 60000}
      var requestCounterMetric = spmClient.getCustomMetric (options)
```

When the interval parameter is specified a timer is created and there is no need to use the "save" function, the timer calls save() automatically.
The save() function does capture the metric and resets meters, counters or timers.

Measurement functions like histogram(), meter(), timer() add calculated values to the metrics like count, min, max, mean or percentiles.
In case you don't like to send all this values to SPM the used properties can be filtered using the "valueFilter" option.

```js
    var options = {name: 'requests', aggregation: 'avg', filter1: os.hostname(), valueFilter: ['mean', 'count', 'currentRate']}
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
    // save data - only needed if not "interval" is not specified
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
- currentRate: The rate of the meter since the last save() call.
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

## Create Events to be correlated with your metrics in SPM

Add an event to SPM Events, the callback function is optional (see events of spm-metrics-js)

```js
    var spmClient = new SPM(token, 0)
    // configure defaults
    var eventLogger = spmClient.getEventLogger ({
            type: 'security',
            name: 'sec-logger',
            tags: ['security'],
            creator: 'me',
            data: 'String or Base64 coded content'})

    // send Event Message, the callback is optional
    eventLogger.log ('user1 logged in', function (err, res) {
        console.log(err || res)
    })

    process.on ('exit', function () {
        eventLogger.log ('Exit program PID:' + process.pid)
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

