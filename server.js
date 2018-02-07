/**
 * @file This file is reponsible for the server/web layer. 
 * Socket.io is delegated to by requiring Zenboard's 'events' module.
 */
const express = require('express');
const path    = require('path');
const app     = express();
const http    = require('http').Server(app);
const io      = require('socket.io')(http);
const logger  = require('morgan');
const bodyParser    = require('body-parser');

const rows  = require('./routes/rows')(io);
const cards = require('./routes/cards')(io);
const settings    = require('./routes/settings')(io);
const Middleware  = require('./modules/Middleware');
// SocketIO 
require('./modules/events')(io);

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
// Enable CORS
app.use((req, res, next) => { 
  Middleware.enableCors(req, res, next) 
});
// Support AJAX pre-flight
app.options("/*", (req, res, next) => {
  Middleware.supportAjaxPreflight(req, res, next)
});

const jsonParser = bodyParser.json();

/* REST API: SETTINGS *********************************************************/

app.get('/api/board/', settings.fetchAll);

app.post('/api/board/', jsonParser, settings.saveTitle);

/* REST API: ROWS *************************************************************/

/** Initialise the board */
app.get('/api/rows/deep', rows.fetchAllDeep);

/** Delete test data. (GET instead of POST to make it simpler to call from e2e tests). */
app.get('/api/rows/delete-test-data', rows.deleteTestData);

/** Used by "edit row" dialog */
app.get('/api/rows/:id', rows.fetchById);

/** Used for "edit row" dialog (for position dropdown) */
app.get('/api/rows/', rows.fetchAll);

app.post('/api/rows/save', jsonParser, rows.save);

app.get('/api/archive/rows/deep', rows.fetchArchiveDeep);

/* REST API: CARDS ************************************************************/

app.post('/api/cards/save', jsonParser, cards.save);

app.post('/api/cards/move', jsonParser, cards.move);

app.post('/api/cards/create', jsonParser, cards.create);

app.get('/api/cards/:id', cards.fetchById);

app.get('/api/archive/cards/', cards.fetchArchive);

/* ERROR HANDLING *************************************************************/

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  Middleware.my404ErrorHandler(req, res, next);
});

/* INIT ***********************************************************************/

let port = process.env.PORT || 3001;
http.listen(port, function() {
  console.log('Listening on *:' + port);
});
