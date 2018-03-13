'use strict'
let mysql     = require('mysql');
let dbConfig  = require('../../config/db-config').getDbConfig();
let fs        = require('fs');
const debug   = require('debug')('zenboard:test:util');

class TestUtil {

  static fetchCardByTag(tag) {
    debug("Entering fetchCardByTag")
    let sql = "SELECT * FROM card WHERE title = '0F65u28Rc66ORYII card " + tag + "'"
    return new Promise( function(resolve, reject) {
      let conn = mysql.createConnection(dbConfig);
      conn.query(sql, function(err, results) {
        if (err) {
          reject(err);
        }
        resolve(results[0]);
      });
      conn.end();
    });
  }

  static runSqlFile(fileSpec) {
    debug("Entering runSqlFile", fileSpec)
    return new Promise( (resolve, reject) => {
      fs.readFile(fileSpec, 'utf8', (err, sql) => {
        if (err) {
          reject(err);
        }
        var connMulti = mysql.createConnection(dbConfig + '?multipleStatements=true');
        connMulti.query(sql, (error, results, fields) => {
          if (err) {
            reject(err);
          }
          resolve();
        });
        connMulti.end();
      });
    });
  }

  static initTestData() {
    return runSqlFile('./test/integration/setup.sql') // returns a promise
  }
}

module.exports = TestUtil;