/** 
 * This module manages Socket.io events
 */
const debug = require('debug')('zenboard:events');

module.exports = function(io) {
  let module = {};

  io.on('connection', function(socket) {

    // You can respond to socket events here e.g.
    // socket.on('foo', function(arg) { console.log('foo'); } );

    // Our io mainly broadcasts board updates (triggered by AJAX POSTs)

  });

  return module;
}