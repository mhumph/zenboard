/**
 * This file is reponsible for web and socket logic. It delegates to  core.js
 * for "core" logic.
 */
var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io		  = require('socket.io')(http);
var core    = require('./core');
var bodyParser  = require('body-parser')
var MAX_ORDER   = 1000000;

// Register '.mustache' extension with The Mustache Express
app.engine('mustache', require('mustache-express')());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

/** Enable CORS */
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//app.use(bodyParser.urlencoded({extended: false}));
var jsonParser = bodyParser.json();

/* REST API: ROWS *************************************************************/

/** Initialise the board: get all rows, cells and cards */
app.get('/api/rows/deep', function(req, response) {
  // TODO: Handle "no rows" scenario
  core.fetchRowsDeep(false).then(function(rows) {
    response.send(rows);
  }).catch(function(error) {

    // Simplify installing Zenboard: if table doesn't exist then init schema
    if (error.code === 'ER_NO_SUCH_TABLE') {

      // Init then retry query
      core.initSchema().then(core.fetchRowsDeep.bind(core)).then(function(rows) {
        response.send(rows);
      }).catch(function(error) {
        response.status(500).send(error);
      });

    } else {
      response.status(500).send(error);
    }
  });
});

app.get('/api/archive/rows/deep', function(req, response) {
  // TODO: Handle "no rows" scenario
  core.fetchRowsDeep(true).then(function(rows) {
    response.send(rows);
  }).catch(function(error) {
    response.status(500).send(error);
  });
});

/** Get row by id. Used by "edit row" dialog. */
app.get('/api/rows/:id', function(req, response) {
  core.connectThenQuery('SELECT id, title, position, description, is_archived FROM row WHERE id = ?', [req.params.id], function (error, results, fields) {
    sendObject(response, results, error);
  });
});

/** Get all rows. Used for "edit row" dialog (for position dropdown). */
app.get('/api/rows/', function(req, res) {
  core.connectThenQuery('SELECT id, title, position FROM row ORDER BY position ASC', function (error, results, fields) {
    sendArray(res, results, error);
  });
});

app.post('/api/rows/save', jsonParser, (req, response) => {
  var body = req.body;
  console.log('About to save row', body)
  //var isArchived = (body.is_archived)

  var sqlArgs = [body.title, body.position, body.description, body.isArchived, body.id];
  var sql = '';
  if (body.id) {
    sql = 'UPDATE row SET title = ?, position = ?, description = ?, is_archived = ? WHERE id = ?';
  } else {
    sql = 'INSERT INTO row (title, position, description, is_archived) VALUES (?, ?, ?, ?)';
  }
  console.log(sql);

  core.connectThenQuery(sql, sqlArgs, (error, results, fields) => {
    if (!error) {
      if (results && results.insertId) {
        body.id = results.insertId;
      }
      core.updateRowList(body)
      .then(core.fetchRowsDeep.bind(core))
      .then(function(rows) {
        response.sendStatus(200);
        console.log("About to emit boardRefresh");
        io.emit('boardRefresh', rows);
      })
      .catch(function(err) {
        console.log("Error saving row", err);
        response.status(500).send(err);
      });

    } else {
      response.status(500).send(error);
    }
  });
})

/**
 * Delete test data. To avoid problems, test rows have a specific (gibberish)
 * title.
 */
app.get('/api/rows/delete-test-data', function(req, res) {
  console.log("Entering /rows/delete-test-data");
  core.connectThenQuery('DELETE FROM row WHERE title = \'0F65u28Rc66ORYII\'', function (error, results, fields) {
    sendArray(res, results, error);
  });
});

/* REST API: CARDS ************************************************************/

app.get('/api/cards/:id', function(req, response) {
  core.connectThenQuery('SELECT * FROM card WHERE id = ?', [req.params.id], function (error, results, fields) {
    if (error) response.status(500).send(error);
    var card = core.initCard(results)
    response.send(card);
  });
});

/** Get archived tasks. TODO: Order by archive date (instead of created date). */
app.get('/api/archive/tasks/', function(req, res) {
  console.log("Entering /archive/tasks/")
  core.connectThenQuery('SELECT id, title, row_id, col_id FROM card WHERE is_archived = 1 ORDER BY id ASC', function (error, results, fields) {
    sendArray(res, results, error);
  });
});

/** Save card */
app.post('/api/cards/save', jsonParser, function(req, response) {
  var body = req.body;
  console.log('About to save card', body);

  var sql = 'UPDATE card SET title = ?, description = ?, is_archived = ? WHERE id = ?';
  var sqlArgs = [body.title, body.description, body.isArchived, body.id];
  core.connectThenQuery(sql, sqlArgs, function (error, results, fields) {
    //sendStatus(error, response);
    // TODO: emit new data (to update card title on boards)
    if (error) {
      response.status(500).send(error);
    } else {
      core.fetchRowsDeep(false).then(function(rows) {
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

/* API HELPERS ****************************************************************/

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

  socket.on('task:move', function(arg) {
  	console.log('task:move', arg);

    var selectSql = 'SELECT * FROM card WHERE id = ?';
    core.connectThenQuery(selectSql, arg.id, function (error, dataBeforeUpdate, fields) {

      if (error) {
        emitAction(error, 'task:move', arg, socket);
      } else {

        console.log('dataBeforeUpdate', dataBeforeUpdate);
        var updateSql = 'UPDATE card SET row_id = ?, col_id = ?, position = ? WHERE id = ?';
        var sqlArgs = [arg.rowId, arg.colId, arg.position, arg.id];

      	core.connectThenQuery(updateSql, sqlArgs, function (error, results, fields) {
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

    var sql = 'INSERT INTO card (row_id, col_id, position, title) VALUES (?, ?, ?, ?)';
    var sqlArgs = [arg.rowId, arg.colId, arg.position, arg.title];

    core.connectThenQuery(sql, sqlArgs, function (error, results, fields) {
      console.log('task:create inner query returned', results);

      if (!error) {
        arg.id = results.insertId;
        updateCell(arg, socket);
      }
      emitAction(error, 'task:create', arg, socket);
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
      position: MAX_ORDER,
      row_id: arg.rowId,
      col_id: arg.colId
    }
  }
  var sqlArgs = [arg.rowId, arg.colId, arg.position, originalData.position, arg.id];

  // Default SQL for when tasks is added to a cell (or it's order is DEcreased within a cell)
  var sql = 'UPDATE card SET position = (position + 1) WHERE row_id = ? AND col_id = ? AND position >= ? AND position <= ? AND id != ?';

  // Check if the task has been moved within a cell, and it's order has INcreased
  if ((arg.rowId == originalData.row_id) && (arg.colId == originalData.col_id)
      && (arg.position > originalData.position)) {
    sql = 'UPDATE card SET position = (position - 1) WHERE row_id = ? AND col_id = ? AND position <= ? AND position >= ? AND id != ?';
  }

  console.log(sql);
  core.connectThenQuery(sql, sqlArgs, function (error, results, fields) {
    emitAction(error, 'cell:update', arg, socket);

    core.fetchRowsDeep(false).then(function(rows) {
      console.log("About to emit boardRefresh");
      io.emit('boardRefresh', rows);
    }, function(error) {
      console.log("Error in fetchRowsDeep", error);
    });
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
