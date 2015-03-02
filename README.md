spm-metrics-js
==============

[SPM Performance Monitoring](http://www.sematext.com/spm/) - Custom Metrics and Event API client for node.js.

This module implements:
 - [custom metrics API](https://sematext.atlassian.net/wiki/display/PUBSPM/Custom+Metrics)  and
 - [events API](https://sematext.atlassian.net/wiki/display/PUBSPM/Events+Integration)

A free account to generate API tokens is available at [www.sematext.com](https://apps.sematext.com/users-web/register.do)

# Installation
```
    npm install spm-metrics-js
```

# Usage


```
    var SPM = require('spm-metrics-js')
    // YOUR API TOKEN, e.g. from environment variables
    var token =  process.env.SPM_TOKEN
```

Create client object, automatically send every 30 seconds, 0 disables interval transmission.
When transmission interval is disabled metrics are transmitted when the internal buffer size reaches 100 entries.

```
    var spmClient = new SPM(token, 30000)
```


Capture relevant metrics for your application and forward it to SPM

    var userMetric = spmClient.getCustomMetric ({name: 'user.count', aggregation: 'avg', filter1: os.hostname()})
    userMetric.set (users.count)
    ...
    userMetric.set (users.count)


Force sending the metrics immediately

    spmClient.send()

Add an event to SPM Events, the callback function is optional (see events of spm-metrics-js)

    var spmClient = new SPM(token, 0)
    // configure defaults
    var eventLogger = spmClient.getEventLogger ({
            type: 'security',
            name: 'sec-logger',
            tags: ['security'],
            creator: 'me',
            data: "String or Base64 coded content"})

    // send Event Message, the callback is optional
    eventLogger.log ('user1 logged in', function (err, res) {
        console.log(err || res)
    })

    process.on ('exit', function () {
        eventLogger.log ('Exit program PID:' + process.pid)
    })


# Monitoring activity and errors

You can add event handlers for errors and actions

    spmClient.on ('error', console.log)  // outputs {err: 'an error', source: 'send'}
    spmClient.on ('add', console.log) // outputs datapoint added
    spmClient.on ('send metrics', console.log)
    spmClient.on ('send event', console.log)

