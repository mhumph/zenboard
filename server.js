var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io		  = require('socket.io')(http);
var mysql	  = require('mysql');
var bodyParser  = require('body-parser')
var dbConfig  = require('./config/db-config').getDbConfig();
var uiConfig  = require('./config/ui-config').getAppConfig();
var MAX_ORDER = 1000000;

// Register '.mustache' extension with The Mustache Express
app.engine('mustache', require('mustache-express')());

app.set('view engine', 'ejs');//'mustache');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

console.log(dbConfig);

/** Enable CORS (to support other UIs) */
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//app.use(bodyParser.urlencoded({extended: false}));
var jsonParser = bodyParser.json();

function connectThenQuery(sql, arg1, arg2) {
  var conn = mysql.createConnection(dbConfig);
  if (typeof arg2 === 'undefined') {
    conn.query(sql, arg1);
  } else {
    conn.query(sql, arg1, arg2);
  }
  conn.end(); // Will end after query has ended
}

/* UI ************************************************************************/

app.get('/sketch', function (req, res) {
  res.render('index', uiConfig);
})

app.get('/react', function (req, res) {
  res.render('react', uiConfig);
})

/* REST API ******************************************************************/

/** Get all rows */
app.get('/api/rows/', function(req, res) {
  console.log("Entering /rows/");
  connectThenQuery('SELECT id, label, my_order FROM row ORDER BY my_order ASC', function (error, results, fields) {
    console.log("Got /rows/", results);
    sendArray(res, results, error);
    console.log("Sent /rows/")
  });
  console.log("Exiting /rows/");
});

/** Get all rows, cells and cards */
app.get('/api/rows/deep', function(req, response) {
  // TODO: Handle "no rows" scenario
  fetchRowsDeep().then(function(rows) {
    response.send(rows);
  }, function(error) {
    response.status(500).send(error);
  });
});

function fetchRowsDeep() {
  return new Promise(function(resolve, reject) {
    connectThenQuery('SELECT id, label, my_order FROM row ORDER BY my_order ASC', function (error, results, fields) {
      if (error) {
        reject(error);
      } else {
        fetchCardsForRows(results).then(function(rows) {
          resolve(rows);
        }, rejector);
      }
    });
  });
}

function rejector(error) {
  reject(error);
}

function fetchCardsForRows(rawRows) {
  return new Promise(function(resolve, reject) {
    connectThenQuery('SELECT id, label, row_id, col_id FROM task WHERE is_archived = 0 ORDER BY row_id, col_id, my_order ASC', function (error, results, fields) {
      if (error) {
        reject(error);
      } else {
        var rows = initRows(rawRows);
        mergeCardsIntoRows(rows, results);
        resolve(rows);
      }
    });
  });
}

function initRows(rawRows) {
  var out = [];
  for (var i = 0; i < rawRows.length; i++) {
    var rawRow = rawRows[i];
    var thisRow = {
      id: rawRow.id,
      label: rawRow.label,
      position: rawRow.my_order,
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
    console.log('row', thisRow);
  }
  return out;
}

function mergeCardsIntoRows(rows, cards) {
  console.log('rows.length', rows.length);
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

/** Get row by id */
app.get('/api/rows/:id', function(req, response) {
  connectThenQuery('SELECT id, label, my_order, info FROM row WHERE id = ?', [req.params.id], function (error, results, fields) {
    sendObject(res, results, error);
  });
});

/** Get all (unarchived) tasks */
app.get('/api/tasks/', function(req, res) {
  console.log("Entering /tasks/");
  connectThenQuery('SELECT id, label, row_id, col_id FROM task WHERE is_archived = 0 ORDER BY row_id, col_id, my_order ASC', function (error, results, fields) {
    console.log("Got /tasks/");
    sendArray(res, results, error);
    console.log("Send /tasks/");
  });
  console.log("Existing /tasks/");
});

/** Get card by id */
app.get('/api/tasks/:id', function(req, res) {
  connectThenQuery('SELECT * FROM task WHERE id = ?', [req.params.id], function (error, results, fields) {
    sendObject(res, results, error);
  });
});
app.get('/api/cards/:id', function(req, response) {
  connectThenQuery('SELECT * FROM task WHERE id = ?', [req.params.id], function (error, results, fields) {
    if (error) response.status(500).send(error);
    var card = initCard(results)
    response.send(card);
  });
});
function initCard(results) {
  if (results.length < 1) return false;
  var data = results[0];
  var card = {
    id: data.id,
    label: data.label,
    rowId: data.row_id,
    colId: data.col_id,
    position: data.my_order,
    description: data.description,
    isArchived: Boolean(data.is_archived)
  }
  return card;
}

/** Get archived tasks. TODO: Order by archive date (instead of created date). */
app.get('/api/archive/tasks/', function(req, res) {
  console.log("Entering /archive/tasks/")
  connectThenQuery('SELECT id, label, row_id, col_id FROM task WHERE is_archived = 1 ORDER BY id ASC', function (error, results, fields) {
    console.log("Got /archive/tasks/");
    sendArray(res, results, error);
    console.log("Sent /archive/tasks/");
  });
  console.log("Exiting /archive/tasks");
});

/** Save card */
app.post('/api/cards/save', jsonParser, function(req, response) {
  var body = req.body;
  console.log('About to save card', body);

  var sql = 'UPDATE task SET label = ?, description = ?, is_archived = ? WHERE id = ?';
  var sqlArgs = [body.label, body.description, body.isArchived, body.id];
  connectThenQuery(sql, sqlArgs, function (error, results, fields) {
    //sendStatus(error, response);
    // TODO: emit new data (to update card label on boards)
    if (error) {
      response.status(500).send(error);
    } else {
      fetchRowsDeep().then(function(rows) {
        response.sendStatus(200);
        console.log("About to emit boardRefresh");
        io.emit('boardRefresh', rows);
      }, function(error) {
        console.log("Error in fetchRowsDeep", error);
        response.status(500).send(error);
      });
    }
  });
});

// app.post('/api/cards/create', jsonParser, function(req, response) {
//   var body = req.body;
//   console.log('About to create card', body);
//
//   var sql = 'INSERT INTO task (row_id, col_id, my_order, label) VALUES (?, ?, ?, ?)';
//   var sqlArgs = [arg.rowId, arg.colId, arg.myOrder, arg.label];
//
//   connection.query(sql, sqlArgs, function (error, results, fields) {
//     console.log('task:create inner query returned', results);
//
//     if (!error) {
//       arg.id = results.insertId;
//       updateCell(arg, socket);
//     }
//     emitAction(error, 'task:create', arg, socket);
//   });
// })

// function sendStatus(error, response) {
//   if (error) {
//     response.status(500).send(error);
//   } else {
//     response.sendStatus(200);
//   }
// }

/* API HELPERS ***************************************************************/

function sendArray(response, result, error) {
  if (error) {
    response.status(500).send(error);
  } else {
    response.send(result);
  }
}

function sendObject(response, result, error) {
  if (error) {
    response.status(500).send(error);
  } else {
    var resultToSend = (result.length >= 1) ? result[0] : {};
    response.send(resultToSend);
  }
}

/* SOCKET.IO *****************************************************************/

io.on('connection', function(socket) {

  /* V2 **********************************************************************/

  socket.on('move card', function(arg) {
    // TODO: Persist

    var updatedCards = [
      // Row 1, col 1
      {id: 1, label: 'Blah blah', rowId: 1, colId: 1, order: 1},
      // Row 1, col 3
      {id: 2, label: 'Task 1', rowId: 1, colId: 3, order: 1},
      {id: 3, label: 'Task 2', rowId: 1, colId: 3, order: 2},
      // Row 2, col 3
      {id: 4, label: 'My task', rowId: 2, colId: 3, order: 1},
    ];
    io.emit('update cards', updatedCards);
  });

  /* END V2 ******************************************************************/

  socket.on('task:move', function(arg) {
  	console.log('task:move', arg);

    var selectSql = 'SELECT * FROM task WHERE id = ?';
    connectThenQuery(selectSql, arg.id, function (error, dataBeforeUpdate, fields) {

      if (error) {
        emitAction(error, 'task:move', arg, socket);
      } else {

        console.log('dataBeforeUpdate', dataBeforeUpdate);
        var updateSql = 'UPDATE task SET row_id = ?, col_id = ?, my_order = ? WHERE id = ?';
        var sqlArgs = [arg.rowId, arg.colId, arg.myOrder, arg.id];

      	connectThenQuery(updateSql, sqlArgs, function (error, results, fields) {
          console.log('task:move inner query returned', results);

          if (!error) {
            updateCell(arg, socket, dataBeforeUpdate[0]);
            // Tell other clients to move the task too
            socket.broadcast.emit('task:move:sync', arg);
          }
          emitAction(error, 'task:move', arg, socket);
        });
      }

    });
  });

  socket.on('task:create', function(arg) {
    console.log('task:create', arg);

    var sql = 'INSERT INTO task (row_id, col_id, my_order, label) VALUES (?, ?, ?, ?)';
    var sqlArgs = [arg.rowId, arg.colId, arg.myOrder, arg.label];

    connectThenQuery(sql, sqlArgs, function (error, results, fields) {
      console.log('task:create inner query returned', results);

      if (!error) {
        arg.id = results.insertId;
        updateCell(arg, socket);
      }
      emitAction(error, 'task:create', arg, socket);
    });
  });

  socket.on('task:save', function(arg) {
    console.log('task:save', arg);

    var sql = 'UPDATE task SET label = ?, description = ?, is_archived = ? WHERE id = ?';
    var sqlArgs = [arg.label, arg.description, arg.isArchived, arg.id];
    connectThenQuery(sql, sqlArgs, function (error, results, fields) {
      // TODO: If it's archived then set my_order to... null? large int?
      emitAction(error, 'task:save', arg, socket);
    });
  });

  socket.on('row:save', function(arg) {
    console.log('row:save', arg);

    var sqlArgs = [arg.label, arg.myOrder, arg.info, arg.id];
    var sql = '';
    if (arg.id) {
      sql = 'UPDATE row SET label = ?, my_order = ?, info = ? WHERE id = ?';
    } else {
      sql = 'INSERT INTO row (label, my_order, info) VALUES (?, ?, ?)';
    }
    console.log(sql);

    connectThenQuery(sql, sqlArgs, function (error, results, fields) {
      if (!error) {
        if (results && results.insertId) {
          arg.id = results.insertId;
        }
        updateRowList(arg, socket);
      }
      emitAction(error, 'row:save', arg, socket);
    });
  });

});

/**
 * Update order for tasks lower down the cell. REFACTOR: Rename to updateTaskList
 * @param originalData MySql result (queried before updating the moved task)
 */
function updateCell(arg, socket, originalData) {
  // If no originalData provided then assume it's a new card
  if (!originalData) {
    originalData = {
      my_order: MAX_ORDER,
      row_id: arg.rowId,
      col_id: arg.colId
    }
  }
  var sqlArgs = [arg.rowId, arg.colId, arg.myOrder, originalData.my_order, arg.id];

  // Default SQL for when tasks is added to a cell (or it's order is DEcreased within a cell)
  var sql = 'UPDATE task SET my_order = (my_order + 1) WHERE row_id = ? AND col_id = ? AND my_order >= ? AND my_order <= ? AND id != ?';

  // Check if the task has been moved within a cell, and it's order has INcreased
  if ((arg.rowId == originalData.row_id) && (arg.colId == originalData.col_id)
      && (arg.myOrder > originalData.my_order)) {
    sql = 'UPDATE task SET my_order = (my_order - 1) WHERE row_id = ? AND col_id = ? AND my_order <= ? AND my_order >= ? AND id != ?';
  }

  console.log(sql);
  connectThenQuery(sql, sqlArgs, function (error, results, fields) {
    emitAction(error, 'cell:update', arg, socket);

    fetchRowsDeep().then(function(rows) {
      console.log("About to emit boardRefresh");
      io.emit('boardRefresh', rows);
    }, function(error) {
      console.log("Error in fetchRowsDeep", error);
    });
  });
}

/** Update order for rows lower down the list */
function updateRowList(arg, socket) {
  // REFACTOR: More robust to query original data from DB than to pass it from the UI
  var sqlArgs = [arg.myOrder, (arg.originalData.my_order || MAX_ORDER), arg.id];

  // Default SQL for when row's order is DEcreased
  var sql = 'UPDATE row SET my_order = (my_order + 1) WHERE my_order >= ? AND my_order <= ? AND id != ?';
  if (parseInt(arg.myOrder) > arg.originalData.my_order) {
    // For when row's order is INcreased
    sql = 'UPDATE row SET my_order = (my_order - 1) WHERE my_order <= ? AND my_order >= ? AND id != ?';
  }

  console.log(sql, sqlArgs);
  connectThenQuery(sql, sqlArgs, function (error, results, fields) {
    emitAction(error, 'row-list:update', arg, socket);
  });
}

/* SOCKET.IO HELPERS *********************************************************/

/**
 * An action is a user initiated event.
 * Sends to io (if successful) otherwise to the initiating socket.
 * Also logs to console.
 */
function emitAction(error, action, arg, socket) {
  var successStr = (error) ? 'error' : 'success';
  var actionStr = action + ':' + successStr;
  console.log(actionStr);
  if (!error) {
    io.emit(actionStr, arg);     // Tell everyone
  } else {
    socket.emit(actionStr, arg); // Tell only the initiator
  }
}

function actionStr(action, error) {
  var successStr = (error) ? 'error' : 'success';
  var actionStr = action + ':' + successStr;
  console.log(actionStr);
  return actionStr;
}

/* INIT **********************************************************************/

console.log('process.env.PORT=' + process.env.PORT);
var port = process.env.PORT || 3001;
http.listen(port, function() {
  console.log('listening on *:' + port);
});


/* USEFUL SNIPPETS ***********************************************************/

// function runQuery(sql, func) {
//  var out;
//  var connection = mysql.createConnection({
//    host     : 'localhost',
//    user     : 'root',
//    password : 'knightsbridge',
//    database : 'wikiboard'
//  });
//  connection.connect();
//  connection.query('SELECT id, label, col1, col2, col3,col4 FROM row', function (error, results, fields) {
//    if (error) throw error;
//    out = results;
//  });
//  connection.end();
//  return out;
// }
