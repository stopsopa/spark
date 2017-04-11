'use strict';

var path        = require('path');
var mysql       = require('mysql');
var log         = rootrequire(path.join('react', 'webpack', 'log.js'));
var abstract    = require(path.resolve(__dirname, 'db_abstract.jsx'));

let connection;

const config    = rootrequire('config.js');

const moment    = require('moment');

const pool      = mysql.createPool(config.db.mysql);

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

function extend(table, id, more) {
    function cache() {
        abstract.apply(this, arguments);
    }
    cache.prototype = Object.create(abstract.prototype);
    cache.prototype.constructor = cache;

    Object.assign(cache.prototype, more);

    return new cache(table, id, pool);
}

module.exports = {
    pool: pool,
    cache: extend('spark_cache', 'id', {
        cachenew: function () {
            log('test')
        }
    }),
    now: function () {
        return moment().format('YYYY-MM-DD HH:mm:ss');
    }
}