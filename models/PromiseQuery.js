/**
 * @example
 try {
  let firstCard = await PQ.query('select * from card', (results) => {
    return results[0];
  });
  console.log(foo);
} catch(error) {
  console.log(error);
}
 */
'use strict';
let mysql     = require('mysql');
let dbConfig  = require('../config/db-config').getDbConfig();

class PromiseQuery {

  static query(sql, args, callback) {
    return new Promise( (resolve, reject) => {

      if (typeof callback === 'undefined') {
        callback = defaultCallback(resolve, reject)
      } else {
        callback = newCallbackWrapper(callback, resolve, reject);
      }

      let conn = mysql.createConnection(dbConfig);
      conn.query(sql, args, callback);
      conn.end(); // Connection will end after query has ended
    });
  }

  static queryUnique(sql, args) {
    return new Promise( (resolve, reject) => {
      let callback = uniqueCallback(resolve, reject)
      let conn = mysql.createConnection(dbConfig);
      conn.query(sql, args, callback);
      conn.end(); // Connection will end after query has ended
    });
  }
  
}

function newCallbackWrapper(callback, resolve, reject) {
  return function(error, results, fields) {
    if (error) {
      reject(error);
    } else {
      try {
        let output = callback(results, fields);
        resolve(output);
      } catch (callbackError) {
        reject(callbackError);
      }
    }
  }
}

function defaultCallback(resolve, reject) {
  return function(error, results, fields) {
    if (error) {
      reject(error);
    } else {
      resolve(results);
    }
  }
}

/** For "fetchById" queries */
function uniqueCallback(resolve, reject) {
  return function(error, results, fields) {
    if (error) {
      reject(error);
    } else {
      if (results.length === 0) {
        reject("Zero rows returned");
      } else {
        resolve(results[0]);
      }
    }
  }
}

module.exports = PromiseQuery;