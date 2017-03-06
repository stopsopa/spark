'use strict';

var path        = require('path');
var mysql       = require('mysql');
var log         = rootrequire(path.join('react', 'webpack', 'log.js'));
var abstract    = require(path.resolve(__dirname, 'db_abstract.jsx'));

var connection;

var config      = require(path.resolve(__dirname, '..', 'config.js'));

const moment    = require('moment');

// function db(level) {
//
//     if (!connection) {
//
//         connection = mysql.createConnection(config.db);
//
//         connection.connect(function(err) {
//             if (err) {
//                 throw 'error connecting: ' + err.stack;
//             }
//         });
//
//         connection.on('error', function(err) {
//             console.log('connection error: ' + err.code); // 'ER_BAD_DB_ERROR'
//         });
//
//         connection.query("SET NAMES 'UTF8'", function (error, results, fields) {
//             if (error) throw error;
//             // connected!
//         });
//     }
//
//     return connection;
// }

var pool  = mysql.createPool(config.db);

pool
    .on('connection', function (connection) {
        connection
            .query('SET NAMES utf8')
            .on('error', function(err) {
                log.json(err); // 'ER_BAD_DB_ERROR'
            })
        ;
    })
;

function extend(table, more) {
    function cache() {
        abstract.apply(this, arguments);
    }
    cache.prototype = Object.create(abstract.prototype);
    cache.prototype.constructor = cache;

    Object.assign(cache.prototype, more);

    return new cache(table, pool);
}

module.exports = {
    pool: pool,
    cache: extend('spark_cache', {
        cachenew: function () {
            log('test')
        }
    }),
    now: function () {
        return moment().format('YYYY-MM-DD HH:mm:ss');
    }
}