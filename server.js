var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io		  = require('socket.io')(http);
var mysql	  = require('mysql');
var dbConfig  = require('./config/db-config').getDbConfig();
var uiConfig  = require('./config/ui-config').getAppConfig();

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
app.get('/api/tasks/', function(req, res) {
  connection.query('SELECT id, label, row_id, col_id FROM task WHERE is_archived = 0 ORDER BY row_id, col_id, my_order ASC', function (error, results, fields) {
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

io.on('connection', function(socket) {

  socket.on('task:move', function(arg) {
  	console.log('task:move', arg);

    var sql = 'UPDATE task SET row_id = ?, col_id = ?, my_order = ? WHERE id = ?';
    var sqlArgs = [arg.rowId, arg.colId, arg.insertAt, arg.id];

  	connection.query(sql, sqlArgs, function (error, results, fields) {
      console.log('task:move inner query returned', results);

      if (!error) {
        updateCell(arg, socket);
        // Tell other clients to move the task too
        socket.broadcast.emit('task:move:sync', arg);
      }
      emitAction(error, 'task:move', arg, socket);
    });

  });

  socket.on('task:create', function(arg) {
    console.log('task:create', arg);

    var sql = 'INSERT INTO task (row_id, col_id, my_order, label) VALUES (?, ?, ?, ?)';
    var sqlArgs = [arg.rowId, arg.colId, arg.insertAt, arg.label];

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
 * TODO. We should only increment my_order for items between new and 
 **/

/** Update order for tasks lower down the cell. REFACTOR: Rename to updateTaskList */
function updateCell(arg, socket) {
  // var MAX_ORDER = 1000000;
  // var sqlArgs = [arg.rowId, arg.colId, (arg.originalData.my_order || MAX_ORDER), arg.id];

  var sql = 'UPDATE task SET my_order = (my_order + 1) WHERE row_id = ? AND col_id = ? AND my_order >= ? AND id != ?';
  var sqlArgs = [arg.rowId, arg.colId, arg.insertAt, arg.id];
  console.log('sqlArgs', sqlArgs);

  connection.query(sql, sqlArgs, function (error, results, fields) {
    emitAction(error, 'cell:update', arg, socket);
  });
}

/** Update order for rows lower down the list */
function updateRowList(arg, socket) {
  var MAX_ORDER = 1000000;
  var sqlArgs = [arg.myOrder, (arg.originalData.my_order || MAX_ORDER), arg.id];

  // Default SQL for when row's order is DEcreased
  var sql = 'UPDATE row SET my_order = (my_order + 1) WHERE my_order >= ? and my_order <= ? AND id != ?';
  if (parseInt(arg.myOrder) > arg.originalData.my_order) {
    // For when row's order is INcreased
    sql = 'UPDATE row SET my_order = (my_order - 1) WHERE my_order <= ? and my_order >= ? AND id != ?';
  }
  // TODO: Similar my_order logic for tasks

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
var port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log('listening on *:' + port);
});


/* USEFUL SNIPPETS ***********************************************************/

    // // Get all tasks
    // var sql = 'SELECT my_order FROM task WHERE row_id = ? and col_id = ?';
    // connection.query(sql, [arg.rowId, arg.colId], function (error, results, fields) {
    //   console.log('query1 returned', results);
    //   if (error) {
    //     socket.emit('error', {action: 'task:move', payload: arg});
    //     console.log('query1 error', error);
    //   } else {
    //     var prevOrder = 0;
    //     var newTaskOrder = 100;
    //     for (var i = 0; i < results.length; i++) {
    //       var task = results[i];
    //       console.log(task);
    //       if (i == (arg.insertAtIndex - 1)) {
    //         prevOrder = task.my_order;
    //         newTaskOrder = prevOrder + 100; // In case "moved task" is being moved to the end of the list
    //       }
    //       if (i == arg.insertAtIndex) {
    //         if (task.my_order > (prevOrder + 1)) {
    //           // There's room in between 
    //           newTaskOrder = Math.floor((prevOrder + task.my_order) / 2);
    //           moveTask(arg, newTaskOrder, socket);
    //         } else {
    //           console.log('TODO: recalc order', arg);
    //         }
    //       }
    //     }
    //   }
    // });

  // socket.on('task:move', function(arg) {
  //   console.log('task:move', arg);

  //   // Get all tasks
  //   var sql = 'SELECT id FROM task WHERE row_id = ? and col_id = ?';
  //   connection.query(sql, [arg.rowId, arg.colId], function (error, results, fields) {
  //     console.log('query1 returned', results);
      
  //     if (error) {  
  //       socket.emit('error', {action: 'task:move', payload: arg});
  //       console.log('query1 error', error);

  //     } else {        
  //       var newTaskOrder = '';

  //       for (var i = 0; i <= results.length; i++) {
          
  //         if (i == arg.insertAtIndex) {
  //           break;
  //         }

  //         if (i < results.length) {
  //           var task = results[i];
  //           console.log(task);
  //           newTaskOrder = newTaskOrder + task.id + '/';
  //         }
  //       }
  //       // We need to call moveTask after the loop.
  //       // It's possible that <code>i</code> will never <code>== arg.insertAtIndex</code>.
  //       // For example, someone may have deleted a higher task in the list
  //       // (in between sending and recieving the "move" message)
  //       moveTask(arg, newTaskOrder, socket);
  //     }
  //   });

  // });

// function moveTask(arg, newTaskOrder, socket) {
//   var sql = 'UPDATE task SET row_id = ?, col_id = ?, my_order = ? WHERE id = ?';
//   var sqlArgs = [arg.rowId, arg.colId, newTaskOrder, arg.id];
//   console.log('sqlArgs', sqlArgs);
//   connection.query(sql, sqlArgs, function (error, results, fields) {
//     console.log('query2 returned', sqlArgs);
//     if (error) {
//       socket.emit('error', {action: 'task:move', payload: arg});
//     } else {
//       socket.emit('saved', {action: 'task:move', payload: arg});
//     }
//   });
// }

// /** Get all tasks for a row */
// app.get('/rows/:rowId/tasks/', function(req, res) {
//   var rowId = req.params.rowId;
//   var qry = 'SELECT id, label, col_id, my_order FROM task WHERE row_id = ? ORDER BY col_id ASC, my_order ASC';
//   connection.query(qry, [rowId], function (error, results, fields) {
//     // if (error) res.status(500).send(error);
//     // res.send(results);
//     sendResponse(res, results, error);
//   });
// });

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


// function colIdToIndex(id) {
//   switch (id) {
//     case 'todo': return 0;
//     case 'paus': return 1;
//     case 'inpr': return 2;
//     case 'done': return 3;
//     default: 0;
//   }
// }

// /** 
//  * @return An array of rows. Each row contains an array of columns. Each of 
//  * those contains an arrak of tasks. 
//  */
// app.get('/board', function(req, res) {
//   // Get rows
//   connection.query('SELECT id, label FROM row', function (error, rows, fields) {
//     if (error) res.status(500).send(error);

//     //var rowsWithCols = [];
//     for (var i = 0; i < rows.length; i++) {
//       var numRowsCompleted = 0;
//       var row = rows[i];
//       row.cols = [[], [], [], []];

//       // Get row's tasks
//       var qry = 'SELECT id, my_order, label, col_id FROM task WHERE row_id = ' + row.id + ' ORDER BY col_id, my_order ASC';
//       console.log(qry);
//       connection.query(qry, function (error, tasks, fields) {
//         if (error) res.status(500).send(error);

//         // Put each tasks in the relevant column
//         for (var j = 0; j < tasks.length; j++) {
//           var task = tasks[j];
//           var colIndex = colIdToIndex(task['col_id']);
//           row.cols[colIndex].push(task);
//           //rowsWithCols.push(row);
//           numRowsCompleted++;
//         }
//         if (numRowsCompleted >= rows.length) {
//           sendResponse(res, rows, error);
//         }
//       });
//     }
//   });
// });
