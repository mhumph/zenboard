/**
 * This file is reponsible for the server/web layer. It delegates to core.js
 * for "core" logic.
 */
var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var core    = require('./core');
var bodyParser  = require('body-parser')

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

var jsonParser = bodyParser.json();

/* REST API: BOARD ************************************************************/

app.get('/api/board/', function(request, response) {
  core.connectThenQuery('SELECT title FROM board WHERE id = 1', function (error, results, fields) {
    sendObject(response, results, error);
  });
});

app.post('/api/board/', jsonParser, function(request, response) {
  console.log('About to save board title')
  let title = request.body.title
  core.connectThenQuery('UPDATE board SET title = ? WHERE id = 1', [title], function (error, results, fields) {
    sendObject(response, results, error);
  });
});

/* REST API: ROWS *************************************************************/

/** Initialise the board: get all rows, cells and cards */
app.get('/api/rows/deep', function(req, response) {
  // TODO: Handle "no rows" scenario
  core.fetchRowsDeep(false).then(function(rows) {
    response.send(rows);
  }).catch(function(error) {

    // This simplifies installation: if table doesn't exist then init schema
    if (error.code === 'ER_NO_SUCH_TABLE') {

      // Init then retry query
      core.initSchema().then(core.fetchRowsDeep.bind(core)).then(function(rows) {
        response.send(rows);
      }).catch(function(error) {
        sendError(response, error);
      });

    } else {
      sendError(response, error);
    }
  });
});

/**
 * Delete test data. To avoid problems, test rows have a specific (gibberish)
 * title. (GET instead of POST to make it simpler to call from e2e tests).
 */
app.get('/api/rows/delete-test-data', function(req, res) {
  console.log("About to delete test data");
  core.connectThenQuery('DELETE FROM row WHERE title = \'0F65u28Rc66ORYII\' AND id > 0', function (error, results, fields) {
    sendArray(res, results, error);
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
        emitBoardRefresh(rows);
      })
      .catch(function(err) {
        sendError(response, error, "Error saving row");
      });

    } else {
      sendError(response, error);
    }
  });
})

app.get('/api/archive/rows/deep', function(req, response) {
  core.fetchRowsDeep(true).then(function(rows) {
    response.send(rows);
  }).catch(function(error) {
    sendError(response, error);
  });
});

/* REST API: CARDS ************************************************************/

/** Save card */
app.post('/api/cards/save', jsonParser, function(req, response) {
  var body = req.body;
  console.log('About to save card', body);

  var sql = 'UPDATE card SET title = ?, description = ?, is_archived = ? WHERE id = ?';
  var sqlArgs = [body.title, body.description, body.isArchived, body.id];
  core.connectThenQuery(sql, sqlArgs, function (error, results, fields) {
    if (error) {
      sendError(response, error, "Error updating card");
    } else {
      core.fetchRowsDeep(false).then(function(rows) {
        response.sendStatus(200);
        emitBoardRefresh(rows);
      }, function(error) {
        sendError(response, error, "Error in fetchRowsDeep");
      });
    }
  });
});

app.get('/api/cards/:id', function(req, response) {
  core.connectThenQuery('SELECT * FROM card WHERE id = ?', [req.params.id], function (error, results, fields) {
    if (error) {
      sendError(response, error);
    }
    var card = core.initCard(results)
    response.send(card);
  });
});

/** Get archived cards. TODO: Order by archive date (instead of created date). */
app.get('/api/archive/cards/', function(req, res) {
  core.connectThenQuery('SELECT id, title, row_id, col_id FROM card WHERE is_archived = 1 ORDER BY id ASC', function (error, results, fields) {
    sendArray(res, results, error);
  });
});

/* API HELPERS ****************************************************************/

function sendArray(response, result, error) {
  if (error) {
    sendError(response, error);
  } else {
    response.send(result);
  }
}

function sendObject(response, result, error) {
  if (error) {
    sendError(response, error);
  } else {
    var resultToSend = (result.length >= 1) ? result[0] : {};
    response.send(resultToSend);
  }
}

/** Send 500 Internal Server Error */
function sendError(response, error, msg) {
  if (msg) {
    console.error(msg, error);
  } else {
    console.error(error);
  }
  response.status(500).send(error);
}

/* SOCKET.IO ******************************************************************/

io.on('connection', function(socket) {

  socket.on('card:move', function(arg) {
    console.log('card:move', arg);

    // TODO: Abort if card moved to it's original position
    core.fetchCard(arg)
    .then(core.updateCard.bind(core))
    .then(core.updateDestinationAndSourceCells.bind(core))
    .then(function() {
      // Success
      emitAction(false, 'card:move', arg, socket);
      fetchAndEmitRefresh();
    }).catch(function(error) {
      // Error
      emitAction(error, 'card:move', arg, socket);
    });
  });

  socket.on('card:create', function(arg) {
    console.log('card:create', arg);

    core.createCard(arg)
    .then(core.updateDestinationAndSourceCells.bind(core))
    .then(function() {
      // Success
      emitAction(false, 'card:create', arg, socket);
      fetchAndEmitRefresh();
    }).catch(function(error) {
      // Error
      emitAction(error, 'card:create', arg, socket);
    })
  });

});

/* SOCKET.IO HELPERS **********************************************************/

function fetchAndEmitRefresh() {
  core.fetchRowsDeep(false).then(function(rows) {
    emitBoardRefresh(rows);
  }, function(error) {
    console.log("Error in fetchRowsDeep", error);
  });
}

function emitBoardRefresh(rows) {
  console.log("About to emit boardRefresh");
  io.emit('boardRefresh', rows);
}

/**
 * An action is a user initiated event.
 * Sends to io (if action is successful) otherwise to the initiating socket.
 * Also logs to console.
 */
function emitAction(error, action, arg, socket) {
  var successStr = (error) ? 'error' : 'success';
  var actionStr = action + ':' + successStr;
  console.log(actionStr);
  if (!error) {
    io.emit(actionStr, arg);     // Tell everyone
  } else {
    console.log(error);
    socket.emit(actionStr, arg); // Tell only the initiator
  }
}

function actionStr(action, error) {
  var successStr = (error) ? 'error' : 'success';
  var actionStr = action + ':' + successStr;
  console.log(actionStr);
  return actionStr;
}

/* INIT ***********************************************************************/

console.log('process.env.PORT=' + process.env.PORT);
var port = process.env.PORT || 3001;
http.listen(port, function() {
  console.log('listening on *:' + port);
});
