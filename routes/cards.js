/** 
 * This module is responsible for card-related route handlers.
 */
'use strict';
const Card = require('../models/Card');
const Row = require('../models/Row');
//const ModelUtil = require('../models/ModelUtil');
const RouteUtil = require('./RouteUtil')
const EventsUtil = require('../modules/EventsUtil');
const debug = require('debug')('zenboard:routes:cards');

module.exports = function(io) {
  let module = {};

  module.save = async (req, res) => {
    let body = req.body;
    try {
      let card = await Card.save(body);
      let rows = await Row.fetchRowsDeep(false);
      res.sendStatus(200);
      EventsUtil.emitBoardRefreshWithRows(io, rows);
    } catch (error) {
      RouteUtil.sendError(res, error, 'Error in fetchRowsDeep');
    }
  }

  module.fetchById = async (req, res) => {
    try {
      let card = await Card.fetchCardById(req.params.id);
      res.send(card);
    } catch(error) {
      RouteUtil.sendError(res, error);
    }
  }

  /** TODO: Test */
  module.fetchArchive = async (req, res) => {
    try {
      let archivedCards = await Card.fetchArchive();
      RouteUtil.sendArray(res, archivedRows);
    } catch(error) {
      RouteUtil.sendError(res, error);
    }
  }

  return module;
}