/**
 * @example
 * 

 try {
  let foo = await PQ.query('select 1 from dual', (results) => {
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

  static get unique() {
    return function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        if (results.length === 0) {
          reject("Zero rows returned");
        } else {
          resolve(obj);
        }
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

module.exports = PromiseQuery;