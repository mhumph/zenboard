/** @file Functions used by multiple models */
'use strict';
let mysql     = require('mysql');
let dbConfig  = require('../config/db-config').getDbConfig();
let fs        = require('fs');
const MAX_POSITION = 1000000;

class ModelUtil {

  static get MAX_POSITION() {
    return MAX_POSITION;
  }

  static get promiseQuery() {
    return PromiseQuery;
  }

  /** arg1 or arg2 should be a callback */
  static connectThenQuery(sql, arg1, arg2) {
    let conn = mysql.createConnection(dbConfig);
    if (typeof arg2 === 'undefined') {
      conn.query(sql, arg1);
    } else {
      conn.query(sql, arg1, arg2);
    }
    conn.end(); // Connection will end after query has ended
  }

  /** 
   * Create schema
   * @returns {Promise} 
   */
  static initSchema() {
    console.log("Initialising schema");
    return new Promise( (resolve, reject) => {
      fs.readFile('./etc/init-schema.sql', 'utf8', (err, sql) => {
        if (err) {
          reject(err);
        } else {
          var conn = mysql.createConnection(dbConfig + '?multipleStatements=true');
          conn.query(sql, (error, results, fields) => {
            if (err) {
              reject(err);
            } else {
              console.log("Initialised schema", results);
              resolve();
            }
          });
          conn.end();
        }
      });
    });
  }

  static rejector(error) {
    reject(error);
  }
  
  static rejectIfUndefined(arg, propArray, reject) {
    propArray.forEach(function(prop) {
      if (typeof arg[prop] === 'undefined') {
        reject('Undefined property ' + prop);
      }
    })
  }

}

class PromiseQuery {

  static query(sql, args) {
    return new Promise( (resolve, reject) => {
      ModelUtil.connectThenQuery(sql, args, function (error, results, fields) {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  static queryUnique(sql, id) {
    return new Promise( (resolve, reject) => {
      ModelUtil.connectThenQuery(sql, id, function (error, results, fields) {
        if (error) {
          reject(error);
        } else {
          let obj = (results.length >= 1) ? results[0] : {};
          resolve(obj);
        }
      });
    });
  }
  
}

module.exports = ModelUtil;
