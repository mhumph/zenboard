'use strict'
const ModelUtil = require('../lib/model/ModelUtil')
const PQ = require('../lib/model/PromiseQuery')
const debug = require('debug')('zenboard:models:rows');

class Row {

  /** @returns {Promise} */
  static fetchById(id) {
    const sql = 'SELECT id, title, position, description, is_archived FROM row WHERE id = ?';
    return PQ.queryUnique(sql, id);
  }

  /** @returns {Promise} */
  static fetchAll() {
    const sql = 'SELECT id, title, position FROM row WHERE is_archived = 0 ORDER BY position ASC';
    return PQ.query(sql);
  }

  /** @returns {Promise} */
  static save(row) {
    debug('About to save row', row)
    const title = (row.title) ? row.title.trim() : row.title;
    let sqlArgs = [title, row.position, row.description, row.isArchived, row.id];
    let sql = '';
    if (row.id) {
      sql = 'UPDATE row SET title = ?, position = ?, description = ?, is_archived = ? WHERE id = ?';
    } else {
      sql = 'INSERT INTO row (title, position, description, is_archived) VALUES (?, ?, ?, ?)';
    }
    debug(sql);

    return PQ.query(sql, sqlArgs, (results) => {
      if (results && results.insertId) {
        row.id = results.insertId;
      }
      return row;
    })
  }

  /* Fetches everything, using only two queries */
  static fetchRowsDeep(archived, newCardId) {
    let sql = `SELECT id, title, position, description FROM row WHERE is_archived = ?
      ORDER BY position ASC`;
    archived = (typeof archived === 'undefined') ? false : archived;
    
    return PQ.query(sql, [archived], async (results) => {
      if (results.length === 0) {
        return [];  // No rows, no need to fetch cards
      } else {
        return await Row.fetchCardsForRows(results, newCardId);
      }
    });
  }

  static fetchCardsForRows(rawRows, newCardId) {
    let sql = `SELECT id, title, row_id, col_id FROM card WHERE is_archived = 0
      ORDER BY row_id, col_id, position ASC`;
    
    return PQ.query(sql, false, (results) => {
      let rows = Row.initRows(rawRows);
      Row.mergeCardsIntoRows(rows, results, newCardId);
      return rows;
    });
  }

  /****************************************************************************
   * Populate rows using data from only two queries (one query for rows, one 
   * query for cards)
   ***************************************************************************/

  /** 
   * Maps SQL results to JS objects.
   * @returns Array of row objects. Each row object is initialised with empty 
   * cells.
   */
  static initRows(rawRows) {
    const NUM_COLS = 4;
    let out = [];
    for (let i = 0; i < rawRows.length; i++) {
      let rawRow = rawRows[i];
      let thisRow = {
        id: rawRow.id,
        title: rawRow.title,
        position: rawRow.position,
        description: rawRow.description,
        cells: new Array(NUM_COLS)
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

        if (rowCell) {
          rowCell.cards.push(card);
          row.cells[colId - 1] = rowCell;

          if (colId == newCardId) {
            card.isNew = true;
          }
        } else {
          console.warn('no rowCell: colId ' + colId + ', rowId ' + rowId);
        }
      } else {
        if (rowId !== null) {
          debug('Row not found with id ' + rowId);
        }
      }
    }
  }

  /***************************************************************************/

  /** 
   * @param {Object} savedRow the row that's been inserted or updated 
   * @return {Promise}
   */
  static updateRowList(savedRow) {
    return new Promise( async (resolve, reject) => {
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

        try {
          await PQ.query(sql, sqlArgs);
          resolve();
        } catch(error) {
          reject(error);
        }
      }
    });
  }

  /**
   * To minimise risk, delete is restricted to rows tagged with a specific 
   * (gibberish) title. 
   */
  static deleteTestRows() {
    // TODO: Delete not just rows but cards too
    const sql = 'DELETE FROM row WHERE title = \'0F65u28Rc66ORYII\' AND id > 0';
    return PQ.query(sql);
  }

}

module.exports = Row;