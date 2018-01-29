'use strict'
let ModelUtil = require('./ModelUtil')
const debug = require('debug')('zenboard:models:rows');

class Row {

  /** @returns {Promise} */
  static fetchById(id) {
    const sql = 'SELECT id, title, position, description, is_archived FROM row WHERE id = ?';
    return ModelUtil.promiseQuery.queryUnique(sql, id);
  }

  /** @returns {Promise} */
  static fetchAll() {
    const sql = 'SELECT id, title, position FROM row ORDER BY position ASC';
    return ModelUtil.promiseQuery.query(sql);
  }

  /** @returns {Promise} */
  static save(row) {
    debug('About to save row', row)
    let sqlArgs = [row.title, row.position, row.description, row.isArchived, row.id];
    let sql = '';
    if (row.id) {
      sql = 'UPDATE row SET title = ?, position = ?, description = ?, is_archived = ? WHERE id = ?';
    } else {
      sql = 'INSERT INTO row (title, position, description, is_archived) VALUES (?, ?, ?, ?)';
    }
    debug(sql);

    return new Promise( (resolve, reject) => {
      ModelUtil.connectThenQuery(sql, sqlArgs, (error, results, fields) => {
        if (error) {
          reject(error);
        } else {

          if (results && results.insertId) {
            row.id = results.insertId;
          }
          resolve(row);
        }
      });
    });
  }

  /* Fetches everything, using only two queries */
  static fetchRowsDeep(archived, newCardId) {
    //if (typeof this === 'undefined') throw new Error("fetchRowsDeep: 'this' is undefined")

    archived = (typeof archived === 'undefined') ? false : archived;
    return new Promise((resolve, reject) => {
      let sql = 'SELECT id, title, position, description FROM row WHERE is_archived = ? ORDER BY position ASC';
      ModelUtil.connectThenQuery(sql, [archived], (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          if (results.length === 0) {
            resolve([]);  // No rows, no need to fetch cards
          } else {
            Row.fetchCardsForRows(results, newCardId).then(function(rows) {
              resolve(rows);
            }, ModelUtil.rejector);
          }
        }
      });
    });
  }

  static fetchCardsForRows(rawRows, newCardId) {
    return new Promise( (resolve, reject) => {
      ModelUtil.connectThenQuery('SELECT id, title, row_id, col_id FROM card WHERE is_archived = 0 ORDER BY row_id, col_id, position ASC', (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          let rows = Row.initRows(rawRows);
          Row.mergeCardsIntoRows(rows, results, newCardId);
          resolve(rows);
        }
      });
    });
  }

  static initRows(rawRows) {
    let out = [];
    for (let i = 0; i < rawRows.length; i++) {
      let rawRow = rawRows[i];
      let thisRow = {
        id: rawRow.id,
        title: rawRow.title,
        position: rawRow.position,
        description: rawRow.description,
        cells: new Array(4)
      }
      // Init cells
      for (let j = 0; j < thisRow.cells.length; j++) {
        thisRow.cells[j] = {
          colId: j + 1,
          cards: []
        };
      };
      out.push(thisRow);
    }
    return out;
  }

  static mergeCardsIntoRows(rows, cards, newCardId) {
    for (let i = 0; i < cards.length; i++) {
      let card = cards[i];
      let rowId = card.row_id;
      let row = rows.find( function(el) {return (el.id == rowId)} );
      if (row) {
        let colId = card.col_id;
        let rowCell = row.cells[colId - 1];
        delete card.row_id;
        delete card.col_id;

        rowCell.cards.push(card);
        row.cells[colId - 1] = rowCell;

        if (colId == newCardId) {
          card.isNew = true
        }
      } else {
        if (rowId !== null) {
          debug('Row not found with id ' + rowId);
        }
      }
    }
  }

  /** @param {Object} savedRow the row that's been inserted or updated */
  static updateRowList(savedRow) {
    return new Promise( (resolve, reject) => {
      ModelUtil.rejectIfUndefined(savedRow, ['id', 'position'], reject);
      if (!savedRow.originalPosition) console.warn('WARN: Missing originalPosition');
      if (savedRow.position === savedRow.originalPosition) {
        resolve();
      } else {
        // REFACTOR: More robust to query original data from DB than to pass it from the UI
        let sqlArgs = [savedRow.position, (savedRow.originalPosition || ModelUtil.MAX_POSITION), savedRow.id];

        // Default SQL for when row's order is DEcreased
        let sql = 'UPDATE row SET position = (position + 1) WHERE position >= ? AND position <= ? AND id != ?';
        if (parseInt(savedRow.position) > savedRow.originalPosition) {
          // For when row's order is INcreased
          sql = 'UPDATE row SET position = (position - 1) WHERE position <= ? AND position >= ? AND id != ?';
        }

        debug(sql, sqlArgs);
        ModelUtil.connectThenQuery(sql, sqlArgs, (error, results, fields) => {
          if (error) {
            reject();
          } else {
            resolve();
          }
        });
      }
    });
  }

}

module.exports = Row