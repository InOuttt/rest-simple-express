'use strict';

var dbm;
var type;
var seed;

var fs = require('fs');
var path = require('path');
var Promise;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

exports.up = function(db) {
  const filePath = path.join(__dirname, 'sqls', '20200528001-create_table_sipd_trx_rpjpd_up.sql')
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
      if (err) return reject(err)
      resolve(data);
    })
  })
  .then((data) => {
    return db.runSql(data)
  })
};

exports.down = function(db) {
  const filePath = path.join(__dirname, 'sqls', '20200528002-create_table_sipd_trx_rpjpd_down.sql')
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
      if (err) return reject(err)
      resolve(data);
    })
  })
  .then((data) => {
    return db.runSql(data)
  })
};

exports._meta = {
  "version": 1
};