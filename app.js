/**
 * @file This file is reponsible for the server/web layer. 
 * Socket.io is delegated to by requiring Zenboard's 'events' module.
 */
const express   = require('express');
const path      = require('path');
const socketIo  = require('socket.io');
const logger    = require('morgan');
const bodyParser  = require('body-parser');

const app = express();
const io = socketIo();
app.io = io;

const rowRoutes   = require('./routes/rowRoutes')(io);
const cardRoutes  = require('./routes/cardRoutes')(io);
const settingsRoutes    = require('./routes/settingsRoutes')(io);
const Middleware  = require('./lib/web/Middleware');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
// Enable CORS
app.use((req, res, next) => { 
  Middleware.enableCors(req, res, next);
});
// Support AJAX pre-flight
app.options("/*", (req, res, next) => {
  Middleware.supportAjaxPreflight(req, res, next);
});

const jsonParser = bodyParser.json();

/* REST API: SETTINGS *********************************************************/

app.get('/api/board/', settingsRoutes.fetchAll);

app.post('/api/board/', jsonParser, settingsRoutes.saveTitle);

/* REST API: ROWS *************************************************************/

/** Initialise the board */
app.get('/api/rows/deep', rowRoutes.fetchAllDeep);

/** Delete test data. (GET instead of POST to make it simpler to call from e2e tests). */
app.get('/api/rows/delete-test-data', rowRoutes.deleteTestData);

/** Used by "edit row" dialog */
app.get('/api/rows/:id', rowRoutes.fetchById);

/** Used for "edit row" dialog (for position dropdown) */
app.get('/api/rows/', rowRoutes.fetchAll);

app.post('/api/rows/save', jsonParser, rowRoutes.save);

app.get('/api/archive/rows/deep', rowRoutes.fetchArchiveDeep);

/* REST API: CARDS ************************************************************/

app.post('/api/cards/save', jsonParser, cardRoutes.save);

app.post('/api/cards/move', jsonParser, cardRoutes.move);

app.post('/api/cards/create', jsonParser, cardRoutes.create);

app.get('/api/cards/:id', cardRoutes.fetchById);

app.get('/api/archive/cards/', cardRoutes.fetchArchive);

/* ERROR HANDLING *************************************************************/

// If no other resource is matched then 404
app.use((req, res, next) => {
  res.status(404).send({
    error: "Resource not found!"
  })
});

module.exports = app;
