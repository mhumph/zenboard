'use strict'
const ModelUtil  = require('./ModelUtil')
const PQ  = require('./PromiseQuery')
const debug = require('debug')('zenboard:models:cards');

class Card {

  /** @returns {Promise} */
  static save(card) {
    let sql = 'UPDATE card SET title = ?, description = ?, is_archived = ? WHERE id = ?';
    let sqlArgs = [card.title, card.description, card.isArchived, card.id];
    //return ModelUtil.promiseQuery.query(sql, sqlArgs);
    return PQ.query(sql, sqlArgs);
  }

  /** @returns {Promise} */
  static createCard(arg) {
    let sql = 'INSERT INTO card (row_id, col_id, position, title) VALUES (?, ?, ?, ?)';
    let sqlArgs = [arg.rowId, arg.colId, arg.position, arg.title];

    return PQ.query(sql, sqlArgs, (results) => {
      arg.id = results.insertId;
      return arg;
    })

    // return new Promise( (resolve, reject) => {
    //   ModelUtil.connectThenQuery(sql, sqlArgs, function (error, results, fields) {
    //     if (error) {
    //       reject(error)
    //     } else {
    //       arg.id = results.insertId;
    //       resolve(arg);
    //     }
    //   })
    // })
  }

  /** @returns {Promise} */
  static fetchCardById(id) {
    let sql = 'SELECT * FROM card WHERE id = ?';
    return PQ.query(sql, [id], (results) => {
      return Card.initCard(results);
    });

    // return new Promise( (resolve, reject) => {
    //   ModelUtil.connectThenQuery(sql, [id], function (error, results, fields) {
    //     if (error) {
    //       reject(error);
    //     } else {
    //       let card = Card.initCard(results);
    //       resolve(card);
    //     }
    //   });
    // });
  }

  /** 
   * Adds dataBeforeUpdate prop to arg. 
   * @returns {Promise} 
   */
  static fetchCard(arg) {
    debug("Entering fetchCard");
    let selectSql = 'SELECT * FROM card WHERE id = ?';
    return new Promise( (resolve, reject) => {
      ModelUtil.connectThenQuery(selectSql, arg.id, (error, dataBeforeUpdate, fields) => {
        if (error) {
          reject(error)
        } else {
          arg.originalData = dataBeforeUpdate[0]
          resolve(arg)
        }
      });
    });
  }

  /** Map from SQL result to JS object */
  static initCard(results) {
    if (results.length < 1) return false;
    let data = results[0];
    let card = {
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

  /** @returns {Promise} */
  static updateCard(arg) {
    debug('Entering updateCard', arg);
    if (!arg) throw Error("arg expected")

    let updateSql = 'UPDATE card SET row_id = ?, col_id = ?, position = ? WHERE id = ?';
    let sqlArgs = [arg.rowId, arg.colId, arg.position, arg.id];

    return new Promise( (resolve, reject) => {
      ModelUtil.connectThenQuery(updateSql, sqlArgs, (error, results, fields) => {
        (error) ? reject(error) : resolve(arg);
      });
    });
  }

  /** @returns {Promise} */
  static updateDestinationAndSourceCells(arg) {
    debug("Entering updateDestinationAndSourceCells");
    // If no originalData provided then assume it's a new card
    if (!arg.originalData) {
      arg.originalData = {
        position: ModelUtil.MAX_POSITION, // We don't want sibling cards re-ordered
        row_id: arg.rowId,
        col_id: arg.colId
      }
    }
    return new Promise( (resolve, reject) => {
      Card.updateDestinationCell(arg)
      .then(Card.updateSourceCell)//.bind(this))
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
   * @returns {Promise}
   */
  static updateDestinationCell(arg) {
    debug("Entering updateDestinationCell");

    let originalData = arg.originalData;
    let originalPosition = originalData.position;
    // If the card has moved cell, then we want to update all card's in the cell with a bigger position
    if ((arg.rowId != originalData.row_id) || (arg.colId != originalData.col_id)) {
      originalPosition = ModelUtil.MAX_POSITION;
    }
    let sqlArgs = [arg.rowId, arg.colId, arg.position, originalPosition, arg.id];

    // Default SQL for when tasks is added to a cell (or it's order is DEcreased within a cell)
    let sql = 'UPDATE card SET position = (position + 1) WHERE row_id = ? AND col_id = ? AND position >= ? AND position <= ? AND id != ?';

    // Check if the task has been moved within a cell, and it's order has INcreased
    if ((arg.rowId == originalData.row_id) && (arg.colId == originalData.col_id)
        && (arg.position > originalData.position)) {
      sql = 'UPDATE card SET position = (position - 1) WHERE row_id = ? AND col_id = ? AND position <= ? AND position >= ? AND id != ?';
    }

    debug(sql, sqlArgs);
    return new Promise( (resolve, reject) => {
      ModelUtil.connectThenQuery(sql, sqlArgs, (error, results, fields) => {
        (error) ? reject(error) : resolve(arg);
      });
    });
  }

  /**
   * Update position of cards within the source cell
   * @param arg.originalData MySql result (queried before updating the moved task)
   */
  static updateSourceCell(arg) {
    debug("Entering updateSourceCell");

    let originalData = arg.originalData;

    // If source cell and destination cell are the same then we don't need to do anything
    if ((arg.rowId == originalData.row_id) && (arg.colId == originalData.col_id)) {
      return Promise.resolve(arg);

    } else {
      let sqlArgs = [originalData.row_id, originalData.col_id, originalData.position, arg.id];

      // Move up cards that were below "arg" card
      let sql = 'UPDATE card SET position = (position - 1) WHERE row_id = ? AND col_id = ? AND position >= ? AND id != ?';
      debug(sql, sqlArgs);
      return new Promise( (resolve, reject) => {
        ModelUtil.connectThenQuery(sql, sqlArgs, (error, results, fields) => {
          (error) ? reject(error) : resolve(arg);
        });
      });
    }
  }

  /** 
   * TODO:
   * - Test 
   * - Order by archive date (instead of created date)
   */
  static fetchArchive() {
    let sql = 'SELECT id, title, row_id, col_id FROM card WHERE is_archived = 1 ORDER BY id ASC';
    return ModelUtil.promiseQuery.query(sql);
  }

}

module.exports = Card
