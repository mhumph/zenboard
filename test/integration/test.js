let mysql       = require('mysql');
let assert      = require('assert');
let requireChai = require('chai');
//let core        = require('../../core');
let dbConfig    = require('../../config/db-config').getDbConfig();
let Card        = require('../../models/Card');
let Row         = require('../../models/Row');
let fs          = require('fs');

// TODO: Test "create new card"!

// Cols 1 and 2 each have 3 cards
describe('Moving a card from col 1 to col 2', function() {
  it('From top of col 1 to top of col 2', async function() {
    // cardToMove, toPosition, expectedDestTitles, expectedDestPositions, expectedSrcTitles, expectedSrcPositions
    await moveToCol2("1,1", 1, "1,1 2,1 2,2 2,3", "1 2 3 4", "1,2 1,3", "1 2")
  });

  it("From top of col 1 to middle of col 2", async function() {
    await moveToCol2("1,1", 2, "2,1 1,1 2,2 2,3", "1 2 3 4", "1,2 1,3", "1 2")
  });

  it("From top of col 1 to bottom of col 2", async function() {
    await moveToCol2("1,1", 4, "2,1 2,2 2,3 1,1", "1 2 3 4", "1,2 1,3", "1 2")
  });

  /** From middle of col 1 ****************************************************/

  it("From middle of col 1 to top of col 2", async function() {
    await moveToCol2("1,2", 1, "1,2 2,1 2,2 2,3", "1 2 3 4", "1,1 1,3", "1 2")
  });

  it("From middle of col 1 to middle of col 2", async function() {
    await moveToCol2("1,2", 2, "2,1 1,2 2,2 2,3", "1 2 3 4", "1,1 1,3", "1 2")
  });

  it("From middle of col 1 to bottom of col 2", async function() {
    await moveToCol2("1,2", 4, "2,1 2,2 2,3 1,2", "1 2 3 4", "1,1 1,3", "1 2")
  });

  /** From bottom of col 1 ****************************************************/

  it("From bottom of col 1 to top of col 2", async function() {
    await moveToCol2("1,3", 1, "1,3 2,1 2,2 2,3", "1 2 3 4", "1,1 1,2", "1 2")
  });

  it("From bottom of col 1 to middle of col 2", async function() {
    await moveToCol2("1,3", 2, "2,1 1,3 2,2 2,3", "1 2 3 4", "1,1 1,2", "1 2")
  });

  it("From bottom of col 1 to bottom of col 2", async function() {
    await moveToCol2("1,3", 4, "2,1 2,2 2,3 1,3", "1 2 3 4", "1,1 1,2", "1 2")
  });
});

// Col 3 is empty
describe('Moving a card from col 1 to col 3', function() {
  it('From top of col 1 into (empty) col 3', async function() {
    await moveToCol3("1,1", 1, "1,1", "1", "1,2 1,3", "1 2")
  });

  it('From bottom of col 1 into (empty) col 3', async function() {
    await moveToCol3("1,3", 1, "1,3", "1", "1,1 1,2", "1 2")
  });
});

// Col 4 only has one card
describe('Moving a card from col 4 to col 2', function() {
  it('From col 4 to top of col 2', async function() {
    await moveToCol2("4,1", 1, "4,1 2,1 2,2 2,3", "1 2 3 4", "", "")
  });

  it('From col 4 to bottom of col 2', async function() {
    await moveToCol2("4,1", 4, "2,1 2,2 2,3 4,1", "1 2 3 4", "", "")
  });
});

describe('Moving a card to the same place!', function() {
  it('From top of col 2 to top of col 2!', async function() {
    await moveToCol2("2,1", 1, "2,1 2,2 2,3", "1 2 3", "2,1 2,2 2,3", "1 2 3")
  });

  it('From middle of col 2 to middle of col 2!', async function() {
    await moveToCol2("2,2", 2, "2,1 2,2 2,3", "1 2 3", "2,1 2,2 2,3", "1 2 3")
  });

  it('From bottom of col 2 to bottom of col 2!', async function() {
    await moveToCol2("2,3", 3, "2,1 2,2 2,3", "1 2 3", "2,1 2,2 2,3", "1 2 3")
  });
});

// Bit of a pain getting id for row B :(
describe('Moving a card from row A to row B', function() {
  it('From top of col a1 into (empty) col b2', async function() {
    await moveToColB2("1,1", 1, "1,1", "1", "1,2 1,3", "1 2")
  });

  it('From bottom of col a1 into (empty) col b2', async function() {
    await moveToColB2("1,3", 1, "1,3", "1", "1,1 1,2", "1 2")
  });

  it('From top of col a1 to top of col b1', async function() {
    await moveToColB1("1,1", 1, "1,1 b1,1 b1,2 b1,3", "1 2 3 4", "1,2 1,3", "1 2")
  });

  it('From top of col a1 to bottom of col b1', async function() {
    await moveToColB1("1,1", 4, "b1,1 b1,2 b1,3 1,1", "1 2 3 4", "1,2 1,3", "1 2")
  });

  it('From bottom of col a1 to top of col b1', async function() {
    await moveToColB1("1,3", 1, "1,3 b1,1 b1,2 b1,3", "1 2 3 4", "1,1 1,2", "1 2")
  });

  it('From bottom of col a1 to bottom of col b1', async function() {
    await moveToColB1("1,3", 4, "b1,1 b1,2 b1,3 1,3", "1 2 3 4", "1,1 1,2", "1 2")
  });
});

async function moveToCol2(cardToMove, toPosition, titleCheck, positionCheck, srcTitleCheck, srcPositionCheck) {
  try {
    await runSqlFile('./test/integration/setup.sql')

    let cardData = await fetchCardByTag(cardToMove)
    let cardArg = {
      id: cardData.id,
      rowId: cardData.row_id,
      colId: 2,
      position: toPosition
    }
    let originalCardData = await Card.fetchCard(cardArg)
    console.log("cardArg", cardArg)
    assert.equal(cardArg.originalData.title, "0F65u28Rc66ORYII card " + cardToMove);

    await Card.updateCard(cardArg)
    console.log('CARD UPDATED', cardToMove);
    let updatedCardData = await fetchCardByTag(cardToMove)
    assert.equal(updatedCardData.col_id, 2);
    assert.equal(updatedCardData.position, toPosition);

    await Card.updateDestinationAndSourceCells(originalCardData)
    let col2Cards = await fetchCardsByCol(2)
    let col2Titles = summariseCardTitles(col2Cards)
    let col2Positions = summariseCardPositions(col2Cards)
    assert.equal(col2Titles, titleCheck)
    assert.equal(col2Positions, positionCheck)

    await assertSourcePositions(srcTitleCheck, srcPositionCheck, cardArg.originalData.col_id)
  }
  finally {
    await runSqlFile('./test/integration/teardown.sql')
  }
}

async function moveToCol3(cardToMove, toPosition, titleCheck, positionCheck, srcTitleCheck, srcPositionCheck) {
  try {
    await runSqlFile('./test/integration/setup.sql')

    let cardData = await fetchCardByTag(cardToMove)
    let cardArg = {
      id: cardData.id,
      rowId: cardData.row_id,
      colId: 3,
      position: toPosition
    }
    let originalCardData = await Card.fetchCard(cardArg)
    console.log("cardArg", cardArg)
    assert.equal(cardArg.originalData.title, "0F65u28Rc66ORYII card " + cardToMove);

    await Card.updateCard(cardArg)
    let updatedCardData = await fetchCardByTag(cardToMove)
    assert.equal(updatedCardData.col_id, 3);
    assert.equal(updatedCardData.position, toPosition);

    await Card.updateDestinationAndSourceCells(originalCardData)
    let col3Cards = await fetchCardsByCol(3)
    let col3Titles = summariseCardTitles(col3Cards)
    let col3Positions = summariseCardPositions(col3Cards)
    assert.equal(col3Titles, titleCheck)
    assert.equal(col3Positions, positionCheck)

    await assertSourcePositions(srcTitleCheck, srcPositionCheck, cardArg.originalData.col_id)
  }
  finally {
    await runSqlFile('./test/integration/teardown.sql')
  }
}

async function moveToColB2(cardToMove, toPosition, titleCheck, positionCheck, srcTitleCheck, srcPositionCheck) {
  try {
    await runSqlFile('./test/integration/setup.sql')

    let cardData = await fetchCardByTag(cardToMove)
    let rowBData = await fetchRowB()
    let cardArg = {
      id: cardData.id,
      rowId: rowBData.id,
      colId: 2,
      position: toPosition
    }
    let originalCardData = await Card.fetchCard(cardArg)
    console.log("cardArg", cardArg)
    assert.equal(cardArg.originalData.title, "0F65u28Rc66ORYII card " + cardToMove);

    await Card.updateCard(cardArg)
    let updatedCardData = await fetchCardByTag(cardToMove)
    assert.equal(updatedCardData.col_id, 2);
    assert.equal(updatedCardData.row_id, rowBData.id);
    assert.equal(updatedCardData.position, toPosition);

    await Card.updateDestinationAndSourceCells(originalCardData)
    let col2Cards = await fetchCardsByCol(2, '0F65u28Rc66ORYII integration row B')
    let col2Titles = summariseCardTitles(col2Cards)
    let col2Positions = summariseCardPositions(col2Cards)
    assert.equal(col2Titles, titleCheck, 'destination titles')
    assert.equal(col2Positions, positionCheck, 'destination positions')

    //await assertSourcePositions(srcTitleCheck, srcPositionCheck, cardArg.originalData.col_id)
  }
  finally {
    await runSqlFile('./test/integration/teardown.sql')
  }
}

async function moveToColB1(cardToMove, toPosition, titleCheck, positionCheck, srcTitleCheck, srcPositionCheck) {
  try {
    await runSqlFile('./test/integration/setup.sql')

    let cardData = await fetchCardByTag(cardToMove)
    let rowBData = await fetchRowB()
    let cardArg = {
      id: cardData.id,
      rowId: rowBData.id,
      colId: 1,
      position: toPosition
    }
    let originalCardData = await Card.fetchCard(cardArg)
    console.log("cardArg", cardArg)
    assert.equal(cardArg.originalData.title, "0F65u28Rc66ORYII card " + cardToMove);

    await Card.updateCard(cardArg)
    let updatedCardData = await fetchCardByTag(cardToMove)
    assert.equal(updatedCardData.col_id, 1);
    assert.equal(updatedCardData.row_id, rowBData.id);
    assert.equal(updatedCardData.position, toPosition);

    await Card.updateDestinationAndSourceCells(originalCardData)
    let col1Cards = await fetchCardsByCol(1, '0F65u28Rc66ORYII integration row B')
    let col1Titles = summariseCardTitles(col1Cards)
    let col1Positions = summariseCardPositions(col1Cards)
    assert.equal(col1Titles, titleCheck, 'destination titles')
    assert.equal(col1Positions, positionCheck, 'destination positions')

    //await assertSourcePositions(srcTitleCheck, srcPositionCheck, cardArg.originalData.col_id)
  }
  finally {
    await runSqlFile('./test/integration/teardown.sql')
  }
}

async function assertSourcePositions(expectedTitles, expectedPositions, sourceColId) {
  let cards = await fetchCardsByCol(sourceColId)
  let titles = summariseCardTitles(cards)
  let positions = summariseCardPositions(cards)
  assert.equal(positions, expectedPositions)
  assert.equal(titles, expectedTitles)
}

function fetchCardByTag(tag) {
  console.log("Entering fetchCardByTag")
  let sql = "SELECT * FROM card WHERE title = '0F65u28Rc66ORYII card " + tag + "'"
  return new Promise( function(resolve, reject) {
    let conn = mysql.createConnection(dbConfig);
    conn.query(sql, function(err, results) {
      if (err) {
        reject(err);
      }
      resolve(results[0]);
    });
    conn.end();
  });
}

function fetchRowB() {
  console.log("Entering fetchRowB")
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

function runSqlFile(fileSpec) {
  console.log("Entering runSqlFile", fileSpec)
  return new Promise( (resolve, reject) => {
    fs.readFile(fileSpec, 'utf8', (err, sql) => {
      if (err) {
        reject(err);
      }
      var connMulti = mysql.createConnection(dbConfig + '?multipleStatements=true');
      connMulti.query(sql, (error, results, fields) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
      connMulti.end();
    });
  });
}

function initTestData() {
  return runSqlFile('./test/integration/setup.sql') // returns a promise
}
