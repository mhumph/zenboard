var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/*
Endpoints:
GET /board-load
POST /row-up
POST /row-down
POST /row-remove
POST /row-add-to-top
POST /cell-edit
POST /cell-save
*/

var board = {'boo': 'bar'};

io.on('connection', function(socket) {
  //socket.emit('board-load', board);

  socket.on('board-load', function(arg) {
  	console.log('board-load', arg);
  })

  socket.on('cell-edit', function(arg) {
  	console.log('cell-edit', arg);

  	// TODO: How to send to everyone except sender
    //io.emit('cell-edit', messageObj);
  });

});

console.log('process.env.PORT=' + process.env.PORT);
var port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log('listening on *:' + port);
});