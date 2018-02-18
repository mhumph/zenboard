let mysql       = require('mysql');
let assert      = require('assert');
let requireChai = require('chai');
let dbConfig    = require('../../config/db-config').getDbConfig();
let CardModel   = require('../../models/Card');
let fs          = require('fs');

// Moving a card is more complicated and has separate tests (cardMoveTest.js)

describe('Card', function() {

  beforeEach(async function() {
    await runSqlFile('./test/integration/setup.sql');
  });

  afterEach(async function() {
    await runSqlFile('./test/integration/teardown.sql')
  })

  it('Save model', async function() {
    const cardData = await fetchCardByTag('1,1');
    const cardUpdate = {
      id: cardData.id,
      title: 'my title',
      description: 'my desc',
      isArchived: false,
      someDummyKey: 'blah'
    }
    const card = new CardModel(cardUpdate);
    await card.save();

    const savedCard = await CardModel.fetchById(cardData.id);
    assert.equal(savedCard.title, 'my title');
    assert.equal(savedCard.description, 'my desc');
    assert.equal(savedCard.isArchived, false);
  });

  it('Save model error', async function() {
    const card = new CardModel(); // Has no id!
    card.title = 'my title';
    card.description = 'my desc';
    card.isArchived = false;

    const err = await truthyIfThrows(() => {  
      card.save();
    });
    assert.ok(err);
  });

  it('Create model', async function() {
    const cardData = await fetchCardByTag('1,1');
    const card = new CardModel({
      title: 'my title',
      rowId: cardData.row_id,
      colId: cardData.col_id,
      position: 1,
      someDummyKey: 'blah'
    });
    await card.create();

    const savedCard = await CardModel.fetchById(card.id);
    assert.equal(savedCard.title, 'my title');
    assert.equal(savedCard.rowId, cardData.row_id);
    assert.equal(savedCard.colId, cardData.col_id);
    assert.equal(savedCard.position, 1);
  });

  it('Create model error', async function() {
    const cardData = await fetchCardByTag('1,1');
    const badCard = new CardModel({ // No position
      title: 'Blah',
      rowId: cardData.row_id,
      colId: 3,
    });
    const err = await truthyIfThrows(() => {
      badCard.create();
    });
    assert.ok(err);
  });
});

async function truthyIfThrows(func) {
  try {
    await func();
    return false;
  } catch (err) {
    return true;
  }
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
