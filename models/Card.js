'use strict'
const ModelUtil = require('./ModelUtil')
const PQ = require('./PromiseQuery')
const debug = require('debug')('zenboard:models:cards');

class Card {

  /** @returns {Promise} */
  static saveCard(card) {
    let sql = 'UPDATE card SET title = ?, description = ?, is_archived = ? WHERE id = ?';
    let sqlArgs = [card.title, card.description, card.isArchived, card.id];
    return PQ.query(sql, sqlArgs);
  }

  /** @returns {Promise} card */
  static createCard(card) {
    let sql = 'INSERT INTO card (row_id, col_id, position, title) VALUES (?, ?, ?, ?)';
    let sqlArgs = [card.rowId, card.colId, card.position, card.title];

    return PQ.query(sql, sqlArgs, (results) => {
      card.id = results.insertId;
      return card;
    })
  }

  /** @returns Updated card */
  static async moveCard(card) {
    // TODO: Abort if card moved to it's original position
    const originalCard = await Card.fetchCardById(card.id)
    const updatedCard = await Card.updateCard(card)
    return await Card.updateDestinationAndSourceCells(updatedCard, originalCard)
  }

  /** @returns {Promise} card */
  static fetchCardById(id) {
    let sql = 'SELECT * FROM card WHERE id = ?';
    return PQ.query(sql, [id], (results) => {
      return Card.initCard(results);
    });
  }

  // /** 
  //  * Adds 'originalData' prop to card (before card gets updated). 
  //  * @returns {Promise} 
  //  */
  // static fetchCard(card) {
  //   debug("Entering fetchCard");
  //   let sql = 'SELECT * FROM card WHERE id = ?';

  //   return PQ.query(sql, card.id, (results) => {
  //     card.originalData = results[0];
  //     return card;
  //   });
  // }

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
  static updateCard(card) {
    debug('Entering updateCard', card);
    if (!card) throw Error("card parameter is falsy");

    let sql = 'UPDATE card SET row_id = ?, col_id = ?, position = ? WHERE id = ?';
    let sqlArgs = [card.rowId, card.colId, card.position, card.id];
    return PQ.query(sql, sqlArgs, () => {
      return card;
    });
  }

  /* LOGIC FOR UPDATING CARD POSITIONS ***************************************/

  /** @returns {Promise} */
  static updateDestinationAndSourceCells(arg, originalCard) {
    debug("Entering updateDestinationAndSourceCells");
    if (originalCard) {
      arg.originalData = {
        position: originalCard.position,
        row_id: originalCard.rowId,
        col_id: originalCard.colId
      }
    }
    // If no originalData provided then assume it's a new card
    if (!arg.originalData) {
      arg.originalData = {
        position: ModelUtil.MAX_POSITION, // We don't want sibling cards re-ordered
        row_id: arg.rowId,
        col_id: arg.colId
      }
    }
    return new Promise( async (resolve, reject) => {
      try {
        await Card.updateDestinationCell(arg);
        await Card.updateSourceCell(arg);
        resolve();
      } catch(error) {
        console.error("Error in updateDestinationAndSourceCells", error);
        reject(error);
      }
    });
  }

  /**
   * Update position of cards within the destination cell
   * @param arg.originalData MySql result (queried before updating the moved card)
   * @returns {Promise}
   */
  static updateDestinationCell(arg, originalCard) {
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
    return PQ.query(sql, sqlArgs, () => {
      return arg;
    });
  }

  /**
   * Update position of cards within the source cell
   * @param arg.originalData MySql result (queried before updating the moved task)
   */
  static updateSourceCell(arg, originalCard) {
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
      return PQ.query(sql, sqlArgs, () => {
        return arg;
      });
    }
  }

  /* WORK IN PROGRESS ********************************************************/

  /**
   * TODO: (1) Test, (2) Order by archive date (instead of created date).
   */
  static fetchArchive() {
    let sql = 'SELECT id, title, row_id, col_id FROM card WHERE is_archived = 1 ORDER BY id ASC';
    return PQ.query(sql);
  }

}

module.exports = Card
