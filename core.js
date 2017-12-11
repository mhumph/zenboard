/** Core logic - no UI, HTTP, etc */
'use strict';
let mysql     = require('mysql');
let dbConfig  = require('./config/db-config').getDbConfig();
let fs        = require('fs');
const MAX_POSITION  = 1000000;

/**
API CALLS:
/api/rows/deep
/api/archive/rows/deep
/api/rows/ID
/api/rows/
POST /api/rows/save
/api/cards/ID
POST /api/cards/save

SOCKET CALLS:
task:move
task:create

*/

class Core {

  get MAX_POSITION() {
    return MAX_POSITION;
  }

  /* ROWS *********************************************************************/

  fetchRowsDeep(archived) {
    if (typeof this === 'undefined') throw new Error("fetchRowsDeep: 'this' is undefined")

    archived = (typeof archived === 'undefined') ? false : archived;
    return new Promise((resolve, reject) => {
      var sql = 'SELECT id, title, position FROM row WHERE is_archived = ? ORDER BY position ASC';
      this.connectThenQuery(sql, [archived], (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          if (results.length === 0) {
            resolve([]);  // No rows, no need to fetch cards
          } else {
            this.fetchCardsForRows(results).then(function(rows) {
              resolve(rows);
            }, this.rejector);
          }
        }
      });
    });
  }

  fetchCardsForRows(rawRows) {
    return new Promise( (resolve, reject) => {
      this.connectThenQuery('SELECT id, title, row_id, col_id FROM card WHERE is_archived = 0 ORDER BY row_id, col_id, position ASC', (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          var rows = this.initRows(rawRows);
          this.mergeCardsIntoRows(rows, results);
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
      // console.log('row', thisRow);
    }
    return out;
  }

  mergeCardsIntoRows(rows, cards) {
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
      } else {
        console.log('Row not found with id ' + rowId);
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

  /* UTILS ********************************************************************/

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
