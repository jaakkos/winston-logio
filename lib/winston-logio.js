/*
 *
 * (C) 2013 Jaakko Suutarla
 * MIT LICENCE
 *
 */

var net = require('net'),
    util = require('util'),
    winston = require('winston'),
    Stream = require('stream').Stream;

var Logio = exports.Logio = function (options) {
  this.name = 'logio';
  this.host = options.host || '127.0.0.1';

  if (!options.port) {
    throw Error('Logio port is required');
  }
  this.port = options.port;

  if (!options.node_name) {
    throw Error('Logio node_name is required');
  }
  this.node_name = options.node_name;

  this.log_buffer = [];
  this.delimiter = '\r\n';

  // for socket connection to logio
  this.socket = null;
  this.try_to_connect_time = 3;
  this.connected = false;

  this.connect();
};

util.inherits(Logio, winston.Transport);
winston.transports.Logio = Logio;
Logio.prototype.name = 'logio';

Logio.prototype.log = function (level, msg, meta, callback) {
  var self = this,
      message = winston.clone(meta || {});

  if (self.silent) {
    return callback(null, true);
  }

  message.level = level;
  message.message = msg;
  message.stream = message.stream ? message.stream : 'default stream';

  if (!self.connected) {
    self.log_buffer.push({
      message: message,
      callback: callback
    });
  } else {
    self.sendLog(message, function () {
      self.emit('logged');
      callback(null, true);
    });
  }
};

Logio.prototype.connect = function () {
  var self = this;
  this.socket = new net.Socket();

  this.socket.on('error', function (err) {
    self.connected = false;
    self.socket.destroy();

    if (self.try_to_connect_time > 0) {
      process.nextTick( function () {
        self.try_to_connect_time = self.try_to_connect_time - 1;
        self.connect();
      });
    } else {
      self.silent = true;
    }
  });

  this.socket.on('timeout', function() {
    // TODO: check logio source regarding what to do when it's timeout
  });

  this.socket.on('close', function () {
    self.connected = false;
    self.connect();
  });

  this.socket.connect(self.port, self.host, function () {
    self.announce();
  });
};

Logio.prototype.announce = function () {
  var self = this;
  self.socket.write('+node|' + self.node_name + self.delimiter);
  self.connected = true;
  self.flush();
};

Logio.prototype.flush = function () {
  var self = this;

  for (var i = 0; i < self.log_buffer.length; i++) {
    self.sendLog(self.log_buffer[i].message, self.log_buffer[i].callback);
    self.emit('logged');
  }
  self.log_buffer.length = 0;
};

Logio.prototype.sendLog = function (message, callback) {
  var self = this;
  self.write('+log', message);
  callback();
};

Logio.prototype.write = function (message_type, args) {
  var self = this;

  var message = [
    message_type,
    args.stream,
    self.node_name,
    args.level,
    args.message
  ].join('|') + self.delimiter;

  self.socket.write(message);
};



















