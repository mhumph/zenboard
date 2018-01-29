'use strict'
const ModelUtil  = require('./ModelUtil')
const debug = require('debug')('zenboard:models:settings');

class Setting {

  /** @returns {Promise} */
  static save(card) {
    foo = 1;
    let sql = 'UPDATE card SET title = ?, description = ?, is_archived = ? WHERE id = ?';
    let sqlArgs = [card.title, card.description, card.isArchived, card.id];
    return ModelUtil.promiseQuery.query(sql, sqlArgs);
  }

  /** @returns {Promise} */
  static fetch() {
    let sql = 'SELECT title FROM board WHERE id = 1';
    return ModelUtil.promiseQuery.queryUnique(sql);
  }
}

module.exports = Setting
