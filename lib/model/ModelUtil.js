/** @file Functions used by multiple models */
'use strict';
let mysql     = require('mysql');
let dbConfig  = require('../../config/db-config').getDbConfig();
let fs        = require('fs');
const MAX_POSITION = 1000000;

class ModelUtil {

  static get MAX_POSITION() {
    return MAX_POSITION;
  }

  /** 
   * Create schema. This enables the schema to be auto-created after Zenboard 
   * has been freshly installed.
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
  
  /** Checks if properties exist. Deprecated in favour of Joi. */
  static rejectIfUndefined(arg, propArray, reject) {
    propArray.forEach(function(prop) {
      if (typeof arg[prop] === 'undefined') {
        reject('Undefined property ' + prop);
      }
    })
  }

  /** Can be used as a callback */
  static rejector(error) {
    reject(error);
  }

  /** 
   * arg1 or arg2 should be a callback 
   * @deprecated Use PromiseQuery instead. 
   */
  static connectThenQuery(sql, arg1, arg2) {
    let conn = mysql.createConnection(dbConfig);
    if (typeof arg2 === 'undefined') {
      conn.query(sql, arg1);
    } else {
      conn.query(sql, arg1, arg2);
    }
    conn.end(); // Connection will end after query has ended
  }

}

module.exports = ModelUtil;
