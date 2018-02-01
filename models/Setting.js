'use strict'
const ModelUtil  = require('./ModelUtil')
const PQ = require('./PromiseQuery')
const debug = require('debug')('zenboard:models:settings');

class Setting {

  /** @returns {Promise} */
  static save(card) {
    foo = 1;
    let sql = 'UPDATE card SET title = ?, description = ?, is_archived = ? WHERE id = ?';
    let sqlArgs = [card.title, card.description, card.isArchived, card.id];
    return PQ.query(sql, sqlArgs);
  }

  /** @returns {Promise} */
  static fetch() {
    // Currently only one board (and it has id = 1)
    let sql = 'SELECT title FROM board WHERE id = 1';
    return PQ.queryUnique(sql);
  }
}

module.exports = Setting
