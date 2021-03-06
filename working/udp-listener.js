'use strict'

const PORT = 8888;
const HOST = '127.0.0.1';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('listening', function () {
  const address = server.address();
  console.log(`UDP server listening on ${address.address}:${address.port}`);
});

server.on('message', function (message, remote) {
  console.log(`${remote.address}:${remote.port} - ${message}`);
});

//server.bind(PORT, HOST);
server.bind(PORT, HOST)


/*
var PORT = 8888;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var message = new Buffer('My KungFu is Good!');

var client = dgram.createSocket('udp4');
client.send(message, 0, message.length, PORT, HOST, function (err, bytes) {
  if (err) throw err;
  console.log('UDP message sent to ' + HOST + ':' + PORT);
  client.close();
});
// */
