var SPM = require('../lib/index.js')
var token = process.env.SPM_TOKEN
var util = require ('util')

describe('spm custom metrics ', function() {
  it('should pass', function(done) {
    try {
      var spmcm = new SPM(token, 0)
      spmcm.once('send metrics', function (event) {
        done()
      })
      var testMetric = spmcm.getCustomMetric({ name: 'test.metric', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2' })
      testMetric.set(42)
      testMetric.set(34)
      var userCountMetric = spmcm.getCustomMetric({ name: 'user.count', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2' })
      userCountMetric.set(23)
      spmcm.send()
    } catch (err) {
      done(err)
    }

  })

  it('log events', function (done) {
    this.timeout(10000)
    try {
      var spmcm = new SPM(token, 0)
      var eventLogger = spmcm.getEventLogger({
        type: 'security',
        name: 'sec-logger',
        tags: ['security'],
        creator: 'me',
      data: 'String or Base64 coded content' })
      eventLogger.log('user1 logged in', function(err, res) {
        //console.log(res.body)
        done()
      })
    } catch (err) {
      done(err)
    }
  })

  it('meter', function (done) {
    this.timeout(30000)
    try {
      var spmcm = new SPM(token, 0)
      var value = {}
      spmcm.once('send metrics', function (event) {
          if (value.count>0)
            done()
      })
      var testMetric = spmcm.getCustomMetric({ name: 'test.meter', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2', valueFilter: ['count','mean'] })
      testMetric.meter()
      testMetric.mark()
      value = testMetric.save()
      spmcm.send()
    } catch (err) {
      done(err)
    }
  })

  it('counter', function (done) {
    this.timeout(30000)
    try {
      var spmcm = new SPM(token, 0)
      var value = 0
      spmcm.once('send metrics', function (event) {
        if (value>0)
          done()
        else
          done ('failed ' + value)
      })
      var testMetric = spmcm.getCustomMetric({ name: 'test.meter', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2', valueFilter: ['count','mean'] })
      testMetric.counter()
      testMetric.inc()
      value = testMetric.save()
      spmcm.send()
    } catch (err) {
      done(err)
    }
  })

  it('histogram', function (done) {
    this.timeout(30000)
    try {
      var spmcm = new SPM(token, 0)
      var value = {}
      spmcm.once('send metrics', function (event) {
        if (value.mean>0)
          done()
      })
      var testMetric = spmcm.getCustomMetric({ name: 'test.histogram', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2' })
      testMetric.histogram()
      testMetric.update(10)
      testMetric.update(20)
      value = testMetric.save()
      spmcm.send()
    } catch (err) {
      done(err)
    }
  })

  it('timer', function (done) {
    this.timeout(30000)
    try {
      var spmcm = new SPM(token, 0)
      var value = {}
      spmcm.once('send metrics', function (event) {
        if (value.min>200)
          done()
        else {
          done (new Error ('value : ' + value.min))
        }
      })
      var testMetric = spmcm.getCustomMetric({ name: 'test.timer', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2' })
      var stopwatch = testMetric.timer().start()
      setTimeout (function () {
        stopwatch.end()
        value = testMetric.save()
        spmcm.send()
      }, 200)
    } catch (err) {
      done(err)
    }
  })

})
