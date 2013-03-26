process.env.NODE_ENV = 'test';

var chai = require('chai'),
    expect = chai.expect,
    net = require('net'),
    winston = require('winston'),
    timekeeper = require('timekeeper'),
    freezed_time = new Date(1330688329321);

chai.Assertion.includeStack = true;

require('../lib/winston-logio');

describe('winston-logio transport', function() {
  var test_server, port = 28777;

  function createTestServer(port, on_data) {
    var server = net.createServer(port, function (socket) {
      socket.on('end', function () { });
      socket.on('data', on_data);
    });
    server.listen(port, function() {});

    return server;
  }

  function createLogger(port) {
    return new (winston.Logger)({
      transports: [
        new (winston.transports.Logio)( { port: port, node_name: 'test', localhost: 'localhost', pid: 12345 } )
      ]
    });
  }

  describe('with logio server', function () {
    var test_server, port = 28777;

    beforeEach(function(done) {
      timekeeper.freeze(freezed_time);
      done();
    });

    it('send logs over TCP', function(done) {
      var response;
      var logger = createLogger(port);

      test_server = createTestServer(port, function (data) {
        response = data.toString();
        expect(response).to.be.equal('+node|localhost|test\r\n+log|localhost|test|info|Fri Mar 02 2012 12:38:49 GMT+0100 (CET)[12345]:hello world{\"stream\":\"worker_feed_split\"}\r\n');
        done();
      });
      logger.log('info', 'hello world', {stream: 'worker_feed_split'});
    });

    // Teardown
    afterEach(function () {
      if (test_server) {
        test_server.close(function () {});
      }
      timekeeper.reset();
      test_server = null;
    });

  });

  describe('without logio server', function () {
    it('fallback to silent mode if log.io server is down', function(done) {
      var response;
      var logger = createLogger(28774);
      logger.log('info', 'hello world', {stream: 'worker_feed_split'});

      expect(logger.transports.logio.retries).to.be.equal(0);

      setTimeout( function () {
        expect(logger.transports.logio.retries).to.be.equal(3);
        expect(logger.transports.logio.silent).to.be.true;
        done();
      }, 1000);

    });
  });


});


