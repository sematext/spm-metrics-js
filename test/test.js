var SPM = require('../lib/index.js')
var token = process.env.SPM_TOKEN
describe('spm custom metrics ', function() {
  it('should pass', function(done) {
    try {
      var spmcm = new SPM(token, 0)
      spmcm.once('send metrics', function (event) {
        //console.log('add event ' + event)
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
      //console.log(token)
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

})
