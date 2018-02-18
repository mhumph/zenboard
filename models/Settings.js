'use strict'
const ModelUtil  = require('../lib/model/ModelUtil')
const PQ = require('../lib/model/PromiseQuery')
const debug = require('debug')('zenboard:models:settings');

/**
 * Currently only one board. It has id 1.
 */
class Settings {

  /** @returns {Promise} */
  static save(title) {
    let sql = 'UPDATE board SET title = ? WHERE id = 1';
    let sqlArgs = [title];
    return PQ.query(sql, sqlArgs);
  }

  /** @returns {Promise} */
  static fetch() {
    let sql = 'SELECT title FROM board WHERE id = 1';
    return PQ.queryUnique(sql);
  }
}

module.exports = Settings
