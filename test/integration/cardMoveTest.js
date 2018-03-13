const mysql       = require('mysql');
const assert      = require('assert');
const requireChai = require('chai');
const dbConfig    = require('../../config/db-config').getDbConfig();
const TestUtil    = require('./testUtil');
const CardModel   = require('../../models/Card');
const Row         = require('../../models/Row');
const fs          = require('fs');
const debug       = require('debug')('zenboard:test:cards');

/** There are _lots_ of card moves to test! */

// Cols 1 and 2 each have 3 cards
describe('Moving a card from col 1 to col 2', function() {

  it('From top of col 1 to top of col 2', async function() {
    // cardToMove, toCell, toPosition, expected
    await assertMove("1,1", 2, 1, {
      targetCell: {titles: "1,1 2,1 2,2 2,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,2 1,3", positions: "1 2"}
    })
  });

  it("From top of col 1 to middle of col 2", async function() {
    await assertMove("1,1", 2, 2, {
      targetCell: {titles: "2,1 1,1 2,2 2,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,2 1,3", positions: "1 2"}
    })
  });

  it("From top of col 1 to bottom of col 2", async function() {
    await assertMove("1,1", 2, 4, {
      targetCell: {titles: "2,1 2,2 2,3 1,1", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,2 1,3", positions: "1 2"}
    })
  });

  /** From middle of col 1 ****************************************************/

  it("From middle of col 1 to top of col 2", async function() {
    await assertMove("1,2", 2, 1, {
      targetCell: {titles: "1,2 2,1 2,2 2,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,1 1,3", positions: "1 2"}
    })
  });

  it("From middle of col 1 to middle of col 2", async function() {
    await assertMove("1,2", 2, 2, {
      targetCell: {titles: "2,1 1,2 2,2 2,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,1 1,3", positions: "1 2"}
    })
  });

  it("From middle of col 1 to bottom of col 2", async function() {
    await assertMove("1,2", 2, 4, {
      targetCell: {titles: "2,1 2,2 2,3 1,2", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,1 1,3", positions: "1 2"}
    })
  });

  /** From bottom of col 1 ****************************************************/

  it("From bottom of col 1 to top of col 2", async function() {
    await assertMove("1,3", 2, 1, {
      targetCell: {titles: "1,3 2,1 2,2 2,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,1 1,2", positions: "1 2"}
    })
  });

  it("From bottom of col 1 to middle of col 2", async function() {
    await assertMove("1,3", 2, 2, {
      targetCell: {titles: "2,1 1,3 2,2 2,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,1 1,2", positions: "1 2"}
    })
  });

  it("From bottom of col 1 to bottom of col 2", async function() {
    await assertMove("1,3", 2, 4, {
      targetCell: {titles: "2,1 2,2 2,3 1,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,1 1,2", positions: "1 2"}
    })
  });
});

// Col 3 is empty
describe('Moving a card from col 1 to col 3', function() {
  it('From top of col 1 into (empty) col 3', async function() {
    await assertMove("1,1", 3, 1, {
      targetCell: {titles: "1,1", positions: "1"}, 
      sourceCell: {titles: "1,2 1,3", positions: "1 2"}
    })
  });

  it('From bottom of col 1 into (empty) col 3', async function() {
    await assertMove("1,3", 3, 1, {
      targetCell: {titles: "1,3", positions: "1"}, 
      sourceCell: {titles: "1,1 1,2", positions: "1 2"}
    })
  });
});

// Col 4 only has one card
describe('Moving a card from col 4 to col 2', function() {
  it('From col 4 to top of col 2', async function() {
    await assertMove("4,1", 2, 1, {
      targetCell: {titles: "4,1 2,1 2,2 2,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "", positions: ""}
    })
  });

  it('From col 4 to bottom of col 2', async function() {
    await assertMove("4,1", 2, 4, {
      targetCell: {titles: "2,1 2,2 2,3 4,1", positions: "1 2 3 4"}, 
      sourceCell: {titles: "", positions: ""}
    })
  });
});

describe('Moving a card to the same place!', function() {
  it('From top of col 2 to top of col 2!', async function() {
    await assertMove("2,1", 2, 1, {
      targetCell: {titles: "2,1 2,2 2,3", positions: "1 2 3"}, 
      sourceCell: {titles: "2,1 2,2 2,3", positions: "1 2 3"}
    })
  });

  it('From middle of col 2 to middle of col 2!', async function() {
    await assertMove("2,2", 2, 2, {
      targetCell: {titles: "2,1 2,2 2,3", positions: "1 2 3"}, 
      sourceCell: {titles: "2,1 2,2 2,3", positions: "1 2 3"}
    })
  });

  it('From bottom of col 2 to bottom of col 2!', async function() {
    await assertMove("2,3", 2, 3, {
      targetCell: {titles: "2,1 2,2 2,3", positions: "1 2 3"}, 
      sourceCell: {titles: "2,1 2,2 2,3", positions: "1 2 3"}
    })
  });
});

describe('Moving a card from row A to row B', function() {
  it('From top of col a1 into (empty) col b2', async function() {
    await assertMoveToRowB("1,1", 2, 1, {
      targetCell: {titles: "1,1", positions: "1"}, 
      sourceCell: {titles: "1,2 1,3", positions: "1 2"}
    })
  });

  it('From bottom of col a1 into (empty) col b2', async function() {
    await assertMoveToRowB("1,3", 2, 1, {
      targetCell: {titles: "1,3", positions: "1"}, 
      sourceCell: {titles: "1,1 1,2", positions: "1 2"}
    })
  });

  it('From top of col a1 to top of col b1', async function() {
    await assertMoveToRowB("1,1", 1, 1, {
      targetCell: {titles: "1,1 b1,1 b1,2 b1,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,2 1,3", positions: "1 2"}
    })
  });

  it('From top of col a1 to bottom of col b1', async function() {
    await assertMoveToRowB("1,1", 1, 4, {
      targetCell: {titles: "b1,1 b1,2 b1,3 1,1", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,2 1,3", positions: "1 2"}
    })
  });

  it('From bottom of col a1 to top of col b1', async function() {
    await assertMoveToRowB("1,3", 1, 1, {
      targetCell: {titles: "1,3 b1,1 b1,2 b1,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,1 1,2", positions: "1 2"}
    })
  });

  it('From bottom of col a1 to bottom of col b1', async function() {
    await assertMoveToRowB("1,3", 1, 4, {
      targetCell: {titles: "b1,1 b1,2 b1,3 1,3", positions: "1 2 3 4"}, 
      sourceCell: {titles: "1,1 1,2", positions: "1 2"}
    })
  });
});

/**
 * @param cardToMove tag e.g. "1,1"
 * @param toCell e.g. 2
 * @param toPosition e.g. 1
 */
async function assertMove(cardToMove, toCell, toPosition, expected) {
  try {
    await TestUtil.runSqlFile('./test/integration/setup.sql');

    let cardData = await TestUtil.fetchCardByTag(cardToMove);
    let cardArg = {
      id: cardData.id,
      rowId: cardData.row_id,
      colId: toCell,
      position: toPosition
    }
    let originalCard = await CardModel.fetchById(cardArg.id)
    debug("cardArg", cardArg)
    assert.equal(originalCard.title, "0F65u28Rc66ORYII card " + cardToMove);

    let updatedCard = new CardModel(cardArg);
    await updatedCard.updatePosition()
    debug('Card updated', cardToMove);
    let updatedCardData = await TestUtil.fetchCardByTag(cardToMove)
    assert.equal(updatedCardData.col_id, toCell);
    assert.equal(updatedCardData.position, toPosition);

    await updatedCard.updateDestinationAndSourceCells(originalCard);
    let col2Cards = await fetchCardsByCol(toCell)
    let col2Titles = summariseCardTitles(col2Cards)
    let col2Positions = summariseCardPositions(col2Cards)
    assert.equal(col2Titles, expected.targetCell.titles)
    assert.equal(col2Positions, expected.targetCell.positions)

    await assertSourcePositions(expected.sourceCell.titles, expected.sourceCell.positions, originalCard.colId);
  }
  finally {
    await TestUtil.runSqlFile('./test/integration/teardown.sql');
  }
}

async function assertMoveToRowB(cardToMove, toCol, toPosition, expected) {
  try {
    await TestUtil.runSqlFile('./test/integration/setup.sql');

    let cardData = await TestUtil.fetchCardByTag(cardToMove);
    let rowBData = await fetchRowB();
    let cardArg = {
      id: cardData.id,
      rowId: rowBData.id,
      colId: toCol,
      position: toPosition
    }
    let originalCard = await CardModel.fetchById(cardArg.id);
    debug("cardArg", cardArg);
    assert.equal(originalCard.title, "0F65u28Rc66ORYII card " + cardToMove);

    let updatedCard = new CardModel(cardArg);
    await updatedCard.updatePosition();
    let updatedCardData = await TestUtil.fetchCardByTag(cardToMove);
    assert.equal(updatedCardData.col_id, toCol);
    assert.equal(updatedCardData.row_id, rowBData.id);
    assert.equal(updatedCardData.position, toPosition);

    await updatedCard.updateDestinationAndSourceCells(originalCard);
    let colCards = await fetchCardsByCol(toCol, '0F65u28Rc66ORYII integration row B');
    let colTitles = summariseCardTitles(colCards);
    let colPositions = summariseCardPositions(colCards);
    assert.equal(colTitles, expected.targetCell.titles, 'destination titles');
    assert.equal(colPositions, expected.targetCell.positions, 'destination positions');
    
    await assertSourcePositions(expected.sourceCell.titles, expected.sourceCell.positions, originalCard.colId);
  }
  finally {
    await TestUtil.runSqlFile('./test/integration/teardown.sql');
  }
}

async function assertSourcePositions(expectedTitles, expectedPositions, sourceColId) {
  let cards = await fetchCardsByCol(sourceColId)
  let titles = summariseCardTitles(cards)
  let positions = summariseCardPositions(cards)
  assert.equal(positions, expectedPositions)
  assert.equal(titles, expectedTitles)
}

function fetchRowB() {
  debug("Entering fetchRowB")
  let sql = "SELECT * FROM row WHERE title = '0F65u28Rc66ORYII integration row B'"
  return new Promise( function(resolve, reject) {
    let conn = mysql.createConnection(dbConfig);
    conn.query(sql, function(err, results) {
      (err) ? reject(err) : resolve(results[0]);
    });
    conn.end();
  });
}

function fetchCardsByCol(colId, rowTitle) {
  rowTitle = rowTitle || '0F65u28Rc66ORYII integration'
  let sql = "SELECT * FROM card WHERE col_id = ? AND row_id = (SELECT id FROM row WHERE title = ?) ORDER BY position ASC"
  return new Promise( function(resolve, reject) {
    let conn = mysql.createConnection(dbConfig)
    conn.query(sql, [colId, rowTitle], function(err, results) {
      if (err) {
        reject(err);
      }
      resolve(results);
    });
    conn.end();
  });
}

function summariseCardTitles(results) {
  let summary = ''
  for (let i = 0; i < results.length; i++) {
    let delim = ((i + 1) < results.length) ? ' ' : ''
    let tag = results[i].title.replace('0F65u28Rc66ORYII card ', '')
    summary = summary + tag + delim
  }
  return summary
}

function summariseCardPositions(results) {
  let summary = ''
  for (let i = 0; i < results.length; i++) {
    let delim = ((i + 1) < results.length) ? ' ' : ''
    summary = summary + results[i].position + delim
  }
  return summary
}
