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

    /* XXX: Make this an Ajax POST */
    socket.on('card:move', function(arg) {
      debug('card:move', arg);

      // TODO: Abort if card moved to it's original position
      Card.fetchCard(arg)
      .then(Card.updateCard)
      .then(Card.updateDestinationAndSourceCells)
      .then(function() {
        // Success
        emitAction(false, 'card:move', arg, socket);
        fetchAndEmitRefresh();
      }).catch(function(error) {
        // Error
        emitAction(error, 'card:move', arg, socket);
      });
    });

    /* XXX: Make this an Ajax POST */
    socket.on('card:create', function(arg) {
      debug('card:create', arg);

      Card.createCard(arg)
      .then(Card.updateDestinationAndSourceCells)
      .then(function() {
        // Success
        socket.emit('cardCreate', arg)
        fetchAndEmitRefresh(arg.id);
      }).catch(function(error) {
        // Error
        socket.emit('cardCreateError', error)
      })
    });

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