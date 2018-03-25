'use strict'
const ModelUtil = require('../lib/model/ModelUtil');
const PQ = require('../lib/model/PromiseQuery');
const debug = require('debug')('zenboard:models:cards');
const Joi = require('joi');

class Card {

  constructor(obj) {
    if (typeof obj === 'object') {
      this.id = obj.id;
      this.title = (obj.title) ? obj.title.trim() : obj.title;
      this.rowId = obj.rowId;
      this.colId = obj.colId;
      this.position = obj.position;
      this.description = obj.description;
      this.isArchived = obj.isArchived;
    }
  }

  static fromRecord(cardRecord) {
    return new Card(Card.sqlToJs(cardRecord));
  }

  /** @returns {Promise} */
  save() {
    Joi.assert(this, schemaForSave, {allowUnknown: true});
    const sql = 'UPDATE card SET title = ?, description = ?, is_archived = ? WHERE id = ?';
    const sqlArgs = [this.title, this.description, this.isArchived, this.id];
    return PQ.query(sql, sqlArgs);
  }

  /** @returns {Promise} card */
  create() {
    Joi.assert(this, schemaForCreate, {allowUnknown: true});
    const sql = 'INSERT INTO card (row_id, col_id, position, title) VALUES (?, ?, ?, ?)';
    const sqlArgs = [this.rowId, this.colId, this.position, this.title];

    return PQ.query(sql, sqlArgs, (results) => {
      this.id = results.insertId;
    })
  }

  /** @returns Updated card */
  async move() {
    Joi.assert(this, schemaForMove, {allowUnknown: true});
    // TODO: Abort if card moved to it's original position
    const originalCard = await Card.fetchById(this.id);
    await this.updatePosition();
    return await this.updateDestinationAndSourceCells(originalCard);
  }

  /** @returns {Promise} card */
  static fetchById(id) {
    const sql = 'SELECT * FROM card WHERE id = ?';
    return PQ.query(sql, [id], (results) => {
      return Card.fromRecord(results);
    });
  }

  /** @returns {Promise} */
  updatePosition() {
    debug('Entering updateCard', this);
    const sql = 'UPDATE card SET row_id = ?, col_id = ?, position = ? WHERE id = ?';
    const sqlArgs = [this.rowId, this.colId, this.position, this.id];
    return PQ.query(sql, sqlArgs);
  }

  /** @returns {Promise} */
  updateDestinationAndSourceCells(originalCard) {
    debug("Entering updateDestinationAndSourceCells");
    // If no originalData provided then assume it's a new card
    if (!originalCard) {
      originalCard = {
        position: ModelUtil.MAX_POSITION, // We don't want sibling cards re-ordered
        rowId: this.rowId,
        colId: this.colId
      }
    }
    return new Promise( async (resolve, reject) => {
      try {
        await CardMover.updateDestinationCell(this, originalCard);
        await CardMover.updateSourceCell(this, originalCard);
        resolve();
      } catch(error) {
        console.error("Error updating destination and source cells", error);
        reject(error);
      }
    });
  }

  /* WORK IN PROGRESS ********************************************************/

  /**
   * TODO: Order by archive date (instead of created date).
   */
  static async fetchArchive() {
    const sql = 'SELECT id, title, row_id, col_id FROM card WHERE is_archived = 1 ORDER BY col_id ASC, id ASC';
    //return PQ.query(sql);

    const cards = await PQ.query(sql);
    const cells = new Array(4);
    for (let i = 0; i <= 3; i++) {
      cells[i] = {
        cards: [],
        colId: i + 1
      }
    }
    cards.forEach(cardData => {
      cells[cardData.col_id - 1].cards.push(cardData);
    });
    return cells;
  }

  /* FOR "PRIVATE" USE *******************************************************/

  /** Map from SQL result to JS object */
  static sqlToJs(results) {
    if (results.length < 1) return false;
    const data = results[0];
    const card = {
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

}

module.exports = Card;

/** Handles the complicated bits! */
class CardMover {

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
    const sqlArgs = [card.rowId, card.colId, card.position, originalPosition, card.id];

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
      const sqlArgs = [originalCard.rowId, originalCard.colId, originalCard.position, card.id];

      // Move up cards that were below <code>card</code>
      const sql = 'UPDATE card SET position = (position - 1) WHERE row_id = ? AND col_id = ? AND position >= ? AND id != ?';
      
      debug(sql, sqlArgs);
      return PQ.query(sql, sqlArgs);
    }
  }
}

const schemaForSave = Joi.object().keys({ // Via card editor
  id: Joi.number().integer().min(0).required(),
  title: Joi.string(),
  description: Joi.string().allow('').allow(null),
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
