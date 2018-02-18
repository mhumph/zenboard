/** 
 * This module is responsible for settings-related route handlers
 */
'use strict';
const RouteUtil = require('../lib/web/RouteUtil')
const Settings = require('../models/Settings')
const debug = require('debug')('zenboard:routes:settings');

module.exports = function(io) {
  const module = {};

  module.fetchAll = async (request, response) => {
    try {
      const settings = await Settings.fetch();
      RouteUtil.sendArray(response, settings);
    } catch(error) {
      RouteUtil.sendError(response, error);
    }
  };

  module.saveTitle = async (request, response) => {
    const title = request.body.title;
    try {
      const result = await Settings.save(title);
      RouteUtil.sendObject(response, result);
    } catch(error) {
      RouteUtil.sendError(response, error);
    }
  };

  return module;
}