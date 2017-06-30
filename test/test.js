var SPM = require('../lib/index.js')
var token = process.env.SPM_TOKEN

// var trace = require ('trace')
describe('spm custom metrics ', function () {
  it('set metric', function (done) {
    try {
      var spmcm = new SPM(token, 0)
      spmcm.once('send metrics', function (event) {
        done()
      })
      spmcm.once('send error', done)
      var testMetric = spmcm.getCustomMetric({ name: 'test.metric', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2' })
      testMetric.set(42)
      testMetric.set(34)
      var userCountMetric = spmcm.getCustomMetric({ name: 'user.count', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2' })
      userCountMetric.set(23)
      userCountMetric.save()
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
      eventLogger.log('user1 logged in', function (err, res) {
        if (!err) {
          done()
        } else {
          done(err)
        }
      })
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
        if (value.min > 0) {
          done()
        } else {
          done(new Error('value : ' + value))
        }
      })
      var testMetric = spmcm.getCustomMetric({ name: 'timer', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2' })
      var stopwatch = testMetric.timer().start()
      setTimeout(function () {
        stopwatch.end()
        value = testMetric.save()
        if (value.min > 0)
          done()
      }, 200)
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
        if (value.count > 0) {
          done()
        }
      })
      var testMetric = spmcm.getCustomMetric({ name: 'meter', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2' })
      testMetric.meter()
      for (var i = 0; i < Math.round(Math.random() * 100 + 1); i++) {
        testMetric.mark()
      }
      value = testMetric.save()
      spmcm.send()
      spmcm.once('send error', done)
    } catch (err) {
      done(err)
    }
  })
  it('meter check valueFilter', function (done) {
    this.timeout(30000)
    try {
      var spmcm = new SPM(token, 0)
      var value = {}
      spmcm.once('send metrics', function (event) {
        if (value.count > 0) {
          done()
        }
      })
      var testMetric = spmcm.getCustomMetric({ name: 'meter', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2',
      valueFilter: ['count'] })
      testMetric.meter()
      for (var i = 0; i < Math.round(Math.random() * 100 + 1); i++) {
        testMetric.mark()
      }
      value = testMetric.save()
      // test for "removed" property 
      if (value.hasOwnProperty('currentRate')) {
        return done(new Error('valueFilter not working'))
      }
      spmcm.send()
      spmcm.once('send error', done)
      spmcm.once('send', done)
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
        if (value == 2) {
          done()
        } else {
          done(new Error('failed value:' + value))
        }
      })
      var testMetric = spmcm.getCustomMetric({ name: 'counter', aggregation: 'sum', filter1: 'filter1', filter2: 'filter2' })
      testMetric.counter(0)
      testMetric.inc()
      testMetric.inc()
      testMetric.inc()
      testMetric.dec()

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
        if (value.mean == 10) {
          done()
        } else {
          done('failed, value: ' + value.mean)
        }
      })
      var testMetric = spmcm.getCustomMetric({ name: 'test.histogram', aggregation: 'avg', filter1: 'filter1', filter2: 'filter2' })
      testMetric.histogram()
      testMetric.update(5)
      testMetric.update(15)
      value = testMetric.save()
      spmcm.send()
    } catch (err) {
      done(err)
    }
  })
})
