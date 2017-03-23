'use strict';

var path        = require('path');
var mysql       = require('mysql');
require(path.resolve(__dirname, '..', '..', 'rootrequire.js'))(__dirname, '..', '..', '..');
var log         = rootrequire('react', 'webpack', 'log.js');
var abstract    = require(path.resolve(__dirname, 'db_abstract.js'));

// const config    = require(path.resolve(__dirname, '..', 'config.js'));
//
// const pool      = mysql.createPool(config.db.mysql);

const moment    = require('moment');

/**
 * db_spark.js
 */
module.exports = function (config) {

    const pool      = mysql.createPool(config);

    function extend(table, id, more) {
        function cache() {
            abstract.apply(this, arguments);
        }
        cache.prototype = Object.create(abstract.prototype);
        cache.prototype.constructor = cache;

        Object.assign(cache.prototype, more);

        return new cache(table, id, pool);
    }

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
    var tables = {
        pool: pool,
        cache: extend('spark_cache', 'id', {
            cachenew: function () {
                log('test')
            }
        }),
        date: (function (tmp) {
            return function (date) {
                var tmp = date || new Date();
                tmp.setSeconds(0,0);
                return tmp;
            }
        }()),
        now: (function (tmp) {
            return function (date) {
                tmp = (tables.date(date)).toISOString().substring(0, 19).split('');
                tmp[10] = ' ';
                return tmp.join('');
            }
        }())
    };

    return tables;
};