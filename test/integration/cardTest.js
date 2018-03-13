const mysql       = require('mysql');
const assert      = require('assert');
const requireChai = require('chai');
const TestUtil    = require('./testUtil');
const dbConfig    = require('../../config/db-config').getDbConfig();
const CardModel   = require('../../models/Card');
const fs          = require('fs');

// Moving a card is more complicated and has separate tests (cardMoveTest.js)

describe('Card', function() {

  beforeEach(async function() {
    await TestUtil.runSqlFile('./test/integration/setup.sql');
  });

  afterEach(async function() {
    await TestUtil.runSqlFile('./test/integration/teardown.sql')
  })

  it('Save model', async function() {
    const cardData = await TestUtil.fetchCardByTag('1,1');
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
    const cardData = await TestUtil.fetchCardByTag('1,1');
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
    const cardData = await TestUtil.fetchCardByTag('1,1');
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
