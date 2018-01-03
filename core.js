/** Core logic - no UI, HTTP, etc */
'use strict'
let mysql     = require('mysql');
let dbConfig  = require('./config/db-config').getDbConfig();
let fs        = require('fs');
const MAX_POSITION  = 1000000;

class Core {

  get MAX_POSITION() {
    return MAX_POSITION;
  }

  /* ROWS *********************************************************************/

  fetchRowsDeep(archived, newCardId) {
    if (typeof this === 'undefined') throw new Error("fetchRowsDeep: 'this' is undefined")

    archived = (typeof archived === 'undefined') ? false : archived;
    return new Promise((resolve, reject) => {
      var sql = 'SELECT id, title, position, description FROM row WHERE is_archived = ? ORDER BY position ASC';
      this.connectThenQuery(sql, [archived], (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          if (results.length === 0) {
            resolve([]);  // No rows, no need to fetch cards
          } else {
            this.fetchCardsForRows(results, newCardId).then(function(rows) {
              resolve(rows);
            }, this.rejector);
          }
        }
      });
    });
  }

  fetchCardsForRows(rawRows, newCardId) {
    return new Promise( (resolve, reject) => {
      this.connectThenQuery('SELECT id, title, row_id, col_id FROM card WHERE is_archived = 0 ORDER BY row_id, col_id, position ASC', (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          var rows = this.initRows(rawRows);
          this.mergeCardsIntoRows(rows, results, newCardId);
          resolve(rows);
        }
      });
    });
  }

  initRows(rawRows) {
    var out = [];
    for (var i = 0; i < rawRows.length; i++) {
      var rawRow = rawRows[i];
      var thisRow = {
        id: rawRow.id,
        title: rawRow.title,
        position: rawRow.position,
        description: rawRow.description,
        cells: new Array(4)
      }
      // Init cells
      for (var j = 0; j < thisRow.cells.length; j++) {
        thisRow.cells[j] = {
          colId: j + 1,
          cards: []
        };
      };
      out.push(thisRow);
    }
    return out;
  }

  mergeCardsIntoRows(rows, cards, newCardId) {
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var rowId = card.row_id;
      var row = rows.find( function(el) {return (el.id == rowId)} );
      if (row) {
        var colId = card.col_id;
        var rowCell = row.cells[colId - 1];
        delete card.row_id;
        delete card.col_id;

        rowCell.cards.push(card);
        row.cells[colId - 1] = rowCell;

        if (colId == newCardId) {
          card.isNew = true
        }
      } else {
        if (rowId !== null) {
          console.log('Row not found with id ' + rowId);
        }
      }
    }
  }

  /** @param {Object} savedRow the row that's been inserted or updated */
  updateRowList(savedRow) {
    return new Promise( (resolve, reject) => {
      this.rejectIfUndefined(savedRow, ['id', 'position'], reject);
      if (!savedRow.originalPosition) console.warn('WARN: Missing originalPosition');
      if (savedRow.position === savedRow.originalPosition) {
        resolve();
      } else {
        // REFACTOR: More robust to query original data from DB than to pass it from the UI
        var sqlArgs = [savedRow.position, (savedRow.originalPosition || MAX_POSITION), savedRow.id];

        // Default SQL for when row's order is DEcreased
        var sql = 'UPDATE row SET position = (position + 1) WHERE position >= ? AND position <= ? AND id != ?';
        if (parseInt(savedRow.position) > savedRow.originalPosition) {
          // For when row's order is INcreased
          sql = 'UPDATE row SET position = (position - 1) WHERE position <= ? AND position >= ? AND id != ?';
        }

        console.log(sql, sqlArgs);
        this.connectThenQuery(sql, sqlArgs, (error, results, fields) => {
          if (error) {
            reject();
          } else {
            resolve();
          }
        });
      }
    });
  }

  /* CARDS ********************************************************************/

  initCard(results) {
    if (results.length < 1) return false;
    var data = results[0];
    var card = {
      id: data.id,
      title: data.title,
      rowId: data.row_id,
      colId: data.col_id,
      position: data.position,
      description: data.description,
      isArchived: Boolean(data.is_archived)
    }
    return card;
  }

  createCard(arg) {
    let sql = 'INSERT INTO card (row_id, col_id, position, title) VALUES (?, ?, ?, ?)';
    let sqlArgs = [arg.rowId, arg.colId, arg.position, arg.title];

    return new Promise( (resolve, reject) => {
      this.connectThenQuery(sql, sqlArgs, function (error, results, fields) {
        if (error) {
          reject(error)
        } else {
          arg.id = results.insertId;
          resolve(arg);
        }
      })
    })
  }

  /** Adds dataBeforeUpdate prop to arg */
  fetchCard(arg) {
    console.log("Entering fetchCard");
    var selectSql = 'SELECT * FROM card WHERE id = ?';
    return new Promise( (resolve, reject) => {
      this.connectThenQuery(selectSql, arg.id, (error, dataBeforeUpdate, fields) => {
        if (error) {
          reject(error)
        } else {
          arg.originalData = dataBeforeUpdate[0]
          resolve(arg)
        }
      });
    });
  }

  updateCard(arg) {
    console.log('Entering updateCard', arg);
    if (!arg) throw Error("arg expected")

    var updateSql = 'UPDATE card SET row_id = ?, col_id = ?, position = ? WHERE id = ?';
    var sqlArgs = [arg.rowId, arg.colId, arg.position, arg.id];

    return new Promise( (resolve, reject) => {
      this.connectThenQuery(updateSql, sqlArgs, (error, results, fields) => {
        (error) ? reject(error) : resolve(arg);
      });
    });
  }

  updateDestinationAndSourceCells(arg) {
    console.log("Entering updateDestinationAndSourceCells");
    // If no originalData provided then assume it's a new card
    if (!arg.originalData) {
      arg.originalData = {
        position: MAX_POSITION,
        row_id: arg.rowId,
        col_id: arg.colId
      }
    }
    return new Promise( (resolve, reject) => {
      this.updateDestinationCell(arg)
      .then(this.updateSourceCell.bind(this))
      .then(resolve)
      .catch(function(error) {
        console.error("Error in updateDestinationAndSourceCells", error);
        reject();
      });
    });
  }

  /**
   * Update position of cards within the destination cell
   * @param arg.originalData MySql result (queried before updating the moved task)
   */
  updateDestinationCell(arg) {
    console.log("Entering updateDestinationCell");

    let originalData = arg.originalData;
    let originalPosition = originalData.position;
    // If the card has moved cell, then we want to update all card's in the cell with a bigger position
    if ((arg.rowId != originalData.row_id) || (arg.colId != originalData.col_id)) {
      originalPosition = MAX_POSITION;
    }
    var sqlArgs = [arg.rowId, arg.colId, arg.position, originalPosition, arg.id];

    // Default SQL for when tasks is added to a cell (or it's order is DEcreased within a cell)
    var sql = 'UPDATE card SET position = (position + 1) WHERE row_id = ? AND col_id = ? AND position >= ? AND position <= ? AND id != ?';

    // Check if the task has been moved within a cell, and it's order has INcreased
    if ((arg.rowId == originalData.row_id) && (arg.colId == originalData.col_id)
        && (arg.position > originalData.position)) {
      sql = 'UPDATE card SET position = (position - 1) WHERE row_id = ? AND col_id = ? AND position <= ? AND position >= ? AND id != ?';
    }

    console.log(sql, sqlArgs);
    return new Promise( (resolve, reject) => {
      this.connectThenQuery(sql, sqlArgs, (error, results, fields) => {
        if (error) {
          reject(error)
        } else {
          resolve(arg);
        }
      });
    });
  }

  /**
   * Update position of cards within the source cell
   * @param arg.originalData MySql result (queried before updating the moved task)
   */
  updateSourceCell(arg) {
    console.log("Entering updateSourceCell");

    let originalData = arg.originalData;

    // If source cell and destinatio cell are the same then we don't need to do anything
    if ((arg.rowId == originalData.row_id) && (arg.colId == originalData.col_id)) {
      return Promise.resolve(arg);

    } else {

      var sqlArgs = [originalData.row_id, originalData.col_id, originalData.position, arg.id];

      // Move up cards that were below "arg" card
      var sql = 'UPDATE card SET position = (position - 1) WHERE row_id = ? AND col_id = ? AND position >= ? AND id != ?';
      console.log(sql, sqlArgs);
      return new Promise( (resolve, reject) => {
        this.connectThenQuery(sql, sqlArgs, (error, results, fields) => {
          (error) ? reject(error) : resolve(arg);
        });
      });
    }
  }

  /* UTILS ********************************************************************/

  /** arg1 or arg2 should be a callback */
  connectThenQuery(sql, arg1, arg2) {
    var conn = mysql.createConnection(dbConfig);
    if (typeof arg2 === 'undefined') {
      conn.query(sql, arg1);
    } else {
      conn.query(sql, arg1, arg2);
    }
    conn.end(); // Will end after query has ended
  }

  rejector(error) {
    reject(error);
  }

  rejectIfUndefined(arg, propArray, reject) {
    propArray.forEach(function(prop) {
      if (typeof arg[prop] === 'undefined') {
        reject('Undefined property ' + prop);
      }
    })
  }

  initSchema() {
    console.log("Initialising schema");
    return new Promise( (resolve, reject) => {
      fs.readFile('./etc/init-schema.sql', 'utf8', (err, sql) => {
        if (err) {
          reject(err);
        }
        var conn = mysql.createConnection(dbConfig + '?multipleStatements=true');
        conn.query(sql, (error, results, fields) => {
          if (err) {
            reject(err);
          }
          console.log("Initialised schema", results);
          resolve();
        });
        conn.end();
      });
    });
  }
}

module.exports = new Core()
