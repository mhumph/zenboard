'use strict'
const ModelUtil = require('./ModelUtil')
const PQ = require('./PromiseQuery')
const debug = require('debug')('zenboard:models:cards');
const Joi = require('joi');

const schemaForSave = Joi.object().keys({ // Via card editor
  id: Joi.number().integer().min(0).required(),
  title: Joi.string(),
  description: Joi.string().allow(null),
  isArchived: Joi.boolean()
}).unknown(true);
const schemaForCreate = Joi.object().keys({ // Via "Add card"
  rowId: Joi.number().integer().min(0).required(),
  colId: Joi.number().integer().min(0).required(),
  position: Joi.number().integer().min(0).required(),
  title: Joi.string().required()
}).unknown(true);
const schemaForMove = Joi.object().keys({ // Via drag and drop
  id: Joi.number().integer().min(0).required(),
  rowId: Joi.number().integer().min(0).required(),
  colId: Joi.number().integer().min(0).required(),
  position: Joi.number().integer().min(0).required()
}).unknown(true);

class Card {

  /** @returns {Promise} */
  static saveCard(card) {
    Joi.assert(card, schemaForSave, {allowUnknown: true});
    let sql = 'UPDATE card SET title = ?, description = ?, is_archived = ? WHERE id = ?';
    let sqlArgs = [card.title, card.description, card.isArchived, card.id];
    return PQ.query(sql, sqlArgs);
  }

  /** @returns {Promise} card */
  static createCard(card) {
    Joi.assert(card, schemaForCreate, {allowUnknown: true});
    let sql = 'INSERT INTO card (row_id, col_id, position, title) VALUES (?, ?, ?, ?)';
    let sqlArgs = [card.rowId, card.colId, card.position, card.title];

    return PQ.query(sql, sqlArgs, (results) => {
      card.id = results.insertId;
      return card;
    })
  }

  /** @returns Updated card */
  static async moveCard(card) {
    Joi.assert(card, schemaForMove, {allowUnknown: true});
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

  /* FOR "PRIVATE" USE *******************************************************/

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

  /* LOGIC FOR UPDATING THE POSITION OF OTHER CARDS **************************/

  /** @returns {Promise} */
  static updateDestinationAndSourceCells(updatedCard, originalCard) {
    debug("Entering updateDestinationAndSourceCells");
    // If no originalData provided then assume it's a new card
    if (!originalCard) {
      originalCard = {
        position: ModelUtil.MAX_POSITION, // We don't want sibling cards re-ordered
        rowId: updatedCard.rowId,
        colId: updatedCard.colId
      }
    }
    return new Promise( async (resolve, reject) => {
      try {
        await Card.updateDestinationCell(updatedCard, originalCard);
        await Card.updateSourceCell(updatedCard, originalCard);
        resolve();
      } catch(error) {
        console.error("Error in updateDestinationAndSourceCells", error);
        reject(error);
      }
    });
  }

  /**
   * Update position of cards within the destination cell
   * @param originalCard Card details prior to update
   * @returns {Promise}
   */
  static updateDestinationCell(card, originalCard) {
    debug("Entering updateDestinationCell");

    let originalPosition = originalCard.position;
    // If the card has moved cell, then we want to update all card's in the cell with a bigger position
    if ((card.rowId != originalCard.rowId) || (card.colId != originalCard.colId)) {
      originalPosition = ModelUtil.MAX_POSITION;
    }
    let sqlArgs = [card.rowId, card.colId, card.position, originalPosition, card.id];

    // Default SQL for when card is added to a cell (or it's order is DEcreased within a cell)
    let sql = 'UPDATE card SET position = (position + 1) WHERE row_id = ? AND col_id = ? AND position >= ? AND position <= ? AND id != ?';

    // Check if the card has been moved within a cell, and it's order has INcreased
    if ((card.rowId == originalCard.rowId) && (card.colId == originalCard.colId)
        && (card.position > originalCard.position)) {
      sql = 'UPDATE card SET position = (position - 1) WHERE row_id = ? AND col_id = ? AND position <= ? AND position >= ? AND id != ?';
    }

    debug(sql, sqlArgs);
    return PQ.query(sql, sqlArgs);
  }

  /**
   * Update position of cards within the source cell
   * @param originalCard Card details prior to update
   */
  static updateSourceCell(card, originalCard) {
    debug("Entering updateSourceCell");

    // If source cell and destination cell are the same then we don't need to do anything
    if ((card.rowId == originalCard.rowId) && (card.colId == originalCard.colId)) {
      return Promise.resolve(card);

    } else {
      let sqlArgs = [originalCard.rowId, originalCard.colId, originalCard.position, card.id];

      // Move up cards that were below <code>card</code>
      let sql = 'UPDATE card SET position = (position - 1) WHERE row_id = ? AND col_id = ? AND position >= ? AND id != ?';
      
      debug(sql, sqlArgs);
      return PQ.query(sql, sqlArgs);
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
