var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io		  = require('socket.io')(http);
var mysql	  = require('mysql');
var dbConfig  = require('./config/react-db-config').getDbConfig();
var uiConfig  = require('./config/ui-config').getAppConfig();
var MAX_ORDER = 1000000;

// Register '.mustache' extension with The Mustache Express
app.engine('mustache', require('mustache-express')());

app.set('view engine', 'ejs');//'mustache');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

// TODO: Pooling + transactions
var connection = mysql.createConnection(dbConfig);
connection.connect();

/** Enable CORS (to support other UIs) */
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* UI ************************************************************************/

app.get('/', function (req, res) {
  res.render('index', uiConfig);
})

app.get('/react', function (req, res) {
  res.render('react', uiConfig);
})

/* REST API ******************************************************************/

/** Get all rows */
app.get('/api/rows/', function(req, res) {
  connection.query('SELECT id, label, my_order FROM row ORDER BY my_order ASC', function (error, results, fields) {
    sendArray(res, results, error);
  });
});

/** Get row by id */
app.get('/api/rows/:id', function(req, res) {
  connection.query('SELECT id, label, my_order, info FROM row WHERE id = ?', [req.params.id], function (error, results, fields) {
    sendObject(res, results, error);
  });
});

/** Get all (unarchived) tasks */
app.get('/api/cards/', function(req, res) {
  connection.query('SELECT id, label, row_id, col_id FROM card WHERE is_archived = 0 ORDER BY row_id, col_id, my_order ASC', function (error, results, fields) {
    sendArray(res, results, error);
  });
});

/** Get task by id */
app.get('/api/tasks/:id', function(req, res) {
  connection.query('SELECT * FROM task WHERE id = ?', [req.params.id], function (error, results, fields) {
    sendObject(res, results, error);
  });
});

/** Get archived tasks. TODO: Order by archive date (instead of created date). */
app.get('/api/archive/tasks/', function(req, res) {
  connection.query('SELECT id, label, row_id, col_id FROM task WHERE is_archived = 1 ORDER BY id ASC', function (error, results, fields) {
    sendArray(res, results, error);
  });
});

/* API HELPERS ***************************************************************/

function sendArray(response, result, error) {
  if (error) response.status(500).send(error);
  response.send(result);
}

function sendObject(response, result, error) {
  if (error) response.status(500).send(error);
  var resultToSend = (result.length >= 1) ? result[0] : {};
  response.send(resultToSend);
}

/* SOCKET.IO *****************************************************************/

// socket, action, arg, error
function emitSimple(socket, action, arg, error) {
  if (error) {
    emitError(socket, action, arg, error);
  } else {
    socket.emit(action, arg);
  }
}

function emitError(socket, action, arg, error) {
  console.log(action, error);
  socket.emit('app error', {
    error: error,
    action: action,
    payload: arg
  });
}

/** Converts column names to camelCase */
function toCardList(records) {
  let out = [];
  records.forEach(function(record) {
    out.push(toCard(record));
  });
  return out;
}

/** Converts column names to camelCase */
function toCard(record) {
  return {
    id: record.id,
    label: record.label,
    rowId: record.row_id,
    colId: record.col_id,
    order: record.my_order,
    description: record.description,
    isArchived: record.is_archived
  }
}

function emitCards(socket) {
  var sql = 'SELECT id, label, row_id, col_id, my_order FROM card WHERE is_archived = 0 ORDER BY row_id, col_id, my_order ASC';
  connection.query(sql, function (error, results, fields) {
    emitSimple(socket, 'cards', toCardList(results), error);
  });
}

io.on('connection', function(socket) {

  /* V2 **********************************************************************/

  socket.on('init cards', function(arg) {
    emitCards(socket);
  });

  socket.on('xxxmove card', function(arg) {
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
    io.emit('cards', updatedCards);
  });

  /* END V2 ******************************************************************/

  socket.on('move card', function(arg) {
  	console.log('move card', arg);

    var selectSql = 'SELECT * FROM card WHERE id = ?';
    connection.query(selectSql, arg.id, function (error, dataBeforeUpdate, fields) {

      if (error) {
        emitError(socket, 'move card: init', arg, error);
      } else {

        console.log('dataBeforeUpdate', dataBeforeUpdate);
        var updateSql = 'UPDATE card SET row_id = ?, col_id = ?, my_order = ? WHERE id = ?';
        var sqlArgs = [arg.rowId, arg.colId, arg.order, arg.id];

      	connection.query(updateSql, sqlArgs, function (error, results, fields) {
          console.log('"move card" inner query returned', results);

          if (error) {
            emitError(socket, 'move card', arg, error);
          } else {
            updateCell(arg, socket, dataBeforeUpdate[0]);
          }
        });
      }

    });
  });

  socket.on('task:create', function(arg) {
    console.log('task:create', arg);

    var sql = 'INSERT INTO task (row_id, col_id, my_order, label) VALUES (?, ?, ?, ?)';
    var sqlArgs = [arg.rowId, arg.colId, arg.myOrder, arg.label];

    connection.query(sql, sqlArgs, function (error, results, fields) {
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
    connection.query(sql, sqlArgs, function (error, results, fields) {
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

    connection.query(sql, sqlArgs, function (error, results, fields) {
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
  console.log('entering updateCell');
  var sqlArgs = [arg.rowId, arg.colId, arg.myOrder, (originalData.my_order || MAX_ORDER), arg.id];

  // Default SQL for when cards is added to a cell (or it's order is DEcreased within a cell)
  var sql = 'UPDATE card SET my_order = (my_order + 1) WHERE row_id = ? AND col_id = ? AND my_order >= ? AND my_order <= ? AND id != ?';

  // Check if the card has been moved within a cell, and it's order has INcreased 
  if ((arg.rowId == originalData.row_id) && (arg.colId == originalData.col_id) 
      && (arg.myOrder > originalData.my_order)) {
    sql = 'UPDATE card SET my_order = (my_order - 1) WHERE row_id = ? AND col_id = ? AND my_order <= ? AND my_order >= ? AND id != ?';
  }

  console.log(sql);
  connection.query(sql, sqlArgs, function (error, results, fields) {
    if (error) {
      emitAction(socket, 'updateCell', arg, error);  
    } else {
      emitCards(socket);
    }
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
  connection.query(sql, sqlArgs, function (error, results, fields) {
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
  var successStr = (error) ? 'app error' : 'success';
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

