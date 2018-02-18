/** 
 * @file This module is responsible for row-related route handlers.
 */
'use strict';
const Row = require('../models/Row');
const ModelUtil = require('../lib/model/ModelUtil');
const RouteUtil = require('../lib/web/RouteUtil');
const EventsUtil = require('../lib/events/EventsUtil');
const debug = require('debug')('zenboard:routes:rows');

module.exports = function(io) {
  const module = {};

  module.save = async (req, res) => {
    const row = req.body;
    try {
      await Row.save(row);
      await Row.updateRowList(row);

      const rows = await Row.fetchRowsDeep();
      res.sendStatus(200);
      EventsUtil.emitBoardRefreshWithRows(io, rows);

    } catch (error) {
      RouteUtil.sendError(res, error);
    }
  }

  module.fetchById = async (req, res) => {
    try {
      const row = await Row.fetchById(req.params.id);
      res.send(row);
    } catch(error) {
      RouteUtil.sendError(res, error);
    }
  }

  module.fetchAll = async (req, res) => {
    try {
      const rows = await Row.fetchAll();
      res.send(rows);
    } catch (error) {
      RouteUtil.sendError(res, error);
    }
  }

  /** Get all rows, cells and cards */
  module.fetchAllDeep = async (req, res, next) => {
    try {
      // TODO: Handle "no rows" scenario
      const rows = await Row.fetchRowsDeep();
      res.send(rows);

    } catch(error) {      
      // This simplifies installation: if table doesn't exist then init schema
      if (error.code === 'ER_NO_SUCH_TABLE') {
        initSchema(res, next);
      } else {
        next(error);
      }
    }
  }

  /* This operation can be public - test data is tagged with a specific (gibberish) title  */
  module.deleteTestData = async (req, res) => {
    try {
      await Row.deleteTestRows();
      res.send('Done');
    } catch (error) {
      RouteUtil.sendError(response, error);
    }
  }

  /* TODO: Test */
  module.fetchArchiveDeep = async (req, response) => {
    try {
      const rows = await Row.fetchRowsDeep(true);
      response.send(rows);
    } catch (error) {
      RouteUtil.sendError(response, error);
    }
  }

  async function initSchema(response, next) {
    try {
      await ModelUtil.initSchema();
      const rows = await Row.fetchRowsDeep()
      response.send(rows);
    } catch(error) {
      next(error);
    }
  }

  return module;
};
