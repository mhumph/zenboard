/** 
 * This module manages Socket.io events
 */
const Card = require('../models/Card');
const Row = require('../models/Row');
const Util = require('./EventsUtil');
const debug = require('debug')('zenboard:events');

module.exports = function(io) {
  let module = {};

  io.on('connection', function(socket) {

    // You can respond to socket events here e.g.
    // socket.on('foo', function(arg) { console.log('foo'); } );

    // Our io mainly broadcasts board updates (triggered by AJAX POSTs)

  });

  function fetchAndEmitRefresh(newCardId) {
    Row.fetchRowsDeep(false, newCardId).then(function(rows) {
      Util.emitBoardRefreshWithRows(io, rows);
    }, function(error) {
      console.warn("Error in fetchRowsDeep", error);
    });
  }

  /**
   * An action is a user initiated event.
   * Sends to io (if action is successful) otherwise to the initiating socket.
   * Also logs to console.
   */
  function emitAction(error, action, arg, socket) {
    let successStr = (error) ? 'error' : 'success';
    let actionStr = action + ':' + successStr;
    debug(actionStr);

    if (!error) {
      io.emit(actionStr, arg);     // Tell everyone
    } else {
      console.warn(error);
      socket.emit(actionStr, arg); // Tell only the initiator
    }
  }

  return module;
}