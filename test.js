var express = require('express');
var app     = express();
var http    = require('http').Server(app);
//var io		  = require('socket.io')(http);
var mysql	  = require('mysql');
var dbConfig  = require('./config/db-config').getDbConfig();

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

console.log(dbConfig);

/** Enable CORS (to support other UIs) */
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

function connectThenQuery(sql, arg1, arg2) {
  var conn = mysql.createConnection(dbConfig);
  if (typeof arg2 === 'undefined') {
    conn.query(sql, arg1);
  } else {
    conn.query(sql, arg1, arg2);
  }
  conn.end(); // Will end after query has ended
}

app.get('/api/rows/', function(req, res) {
  console.log("Entering /rows/");
  connectThenQuery('SELECT id, label, my_order FROM row ORDER BY my_order ASC', function (error, results, fields) {
    console.log("Got /rows/", results);
    sendArray(res, results, error);
    console.log("Sent /rows/")
  });
  console.log("Exiting /rows/");
});

function sendArray(response, result, error) {
  if (error) {
    response.status(500).send(error);
  } else {
    response.send(result);
  }
}

console.log('process.env.PORT=' + process.env.PORT);
var port = process.env.PORT || 3001;
http.listen(port, function() {
  console.log('listening on *:' + port);
});
