/** @file Custom middleware for Express */
'use strict';

class Middleware {

  /** Enable CORS */
  static enableCors(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  };

  /** Support AJAX pre-flight */
  static supportAjaxPreflight(req, res, next) {
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.sendStatus(200);
  };

}

module.exports = Middleware;