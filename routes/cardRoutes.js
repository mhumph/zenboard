/** 
 * This module is responsible for card-related route handlers.
 */
'use strict';
const Card = require('../models/Card');
const Row = require('../models/Row');
const RouteUtil = require('../lib/web/RouteUtil')
const EventsUtil = require('../lib/events/EventsUtil');
const debug = require('debug')('zenboard:routes:cards');

module.exports = function(io) {
  const module = {};

  io.on('connection', function(socket) {
    module.emitCardCreated = (card) => {
      console.log('cardRoutes:emitCardCreated');
      // UI may want to store card id...
      socket.emit('cardCreated', card);
    };
  });

  module.save = async (req, res) => {
    const body = req.body;
    try {
      const card = new Card(body);
      await card.save();
      res.sendStatus(200);

      const rows = await Row.fetchRowsDeep(false);
      EventsUtil.emitBoardRefreshWithRows(io, rows);

      const archivedRows = await Row.fetchRowsDeep(true);
      io.emit('rowArchiveRefresh', archivedRows);

      const archivedCards = await Card.fetchArchive();
      io.emit('cardArchiveRefresh', archivedCards);
    } catch (error) {
      RouteUtil.sendError(res, error, 'Error saving card');
    }
  }

  module.fetchById = async (req, res) => {
    try {
      const card = await Card.fetchById(req.params.id);
      res.send(card);
    } catch(error) {
      RouteUtil.sendError(res, error);
    }
  }

  module.move = async (req, res) => {
    const body = req.body;
    try {
      const card = new Card(body);
      await card.move();
      res.sendStatus(200);

      const rows = await Row.fetchRowsDeep();
      EventsUtil.emitBoardRefreshWithRows(io, rows);
    } catch(error) {
      RouteUtil.sendError(res, error);
    }
  }

  module.create = async (req, res) => {
    const body = req.body;

    try {
      const card = new Card(body);
      await card.create();
      module.emitCardCreated(card);

      await card.updateDestinationAndSourceCells();
      res.sendStatus(200);

      const rows = await Row.fetchRowsDeep();
      EventsUtil.emitBoardRefreshWithRows(io, rows);
      
    } catch(error) {
      RouteUtil.sendError(res, error);
    }
  }

  /** TODO: Test */
  module.fetchArchive = async (req, res) => {
    try {
      const archivedCards = await Card.fetchArchive();
      RouteUtil.sendArray(res, archivedCards);
    } catch(error) {
      RouteUtil.sendError(res, error);
    }
  }

  return module;
}