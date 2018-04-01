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
    row.isArchivedBool = isRowArchived.bind(row);
    
    try {
      const originalRow = (row.id) ? await Row.fetchById(row.id) : null;
      if ((originalRow.isArchived === 1) && (row.isArchivedBool())) {
        row.position = 1; // Simpler to unarchive row into the top
      }
      await Row.save(row);
      
      if ((originalRow.isArchived === 0) && (row.isArchivedBool() === true)) {
        row.position = ModelUtil.MAX_POSITION;  // So other rows move up
        await Row.updateRowList(row);
      }
      if ((originalRow.isArchived === 1) && (row.isArchivedBool() === false)) {
        row.originalPosition = ModelUtil.MAX_POSITION;  // So other rows move up
        await Row.updateRowList(row);
      }
      res.sendStatus(200);

      const rows = await Row.fetchRowsDeep();
      EventsUtil.emitBoardRefreshWithRows(io, rows);

      const archivedRows = await Row.fetchRowsDeep(true);
      io.emit('rowArchiveRefresh', archivedRows);
    } catch (error) {
      RouteUtil.sendError(res, error);
    }
  }

  function isRowArchived() {
    // XXX: Can be 0/1 or true/false depending on where it's initialised
    // XXX: Move this to Row.js 
    return (this.isArchived === true) || (this.isArchived === 1);
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
