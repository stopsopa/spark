'use strict';

var path        = require('path');
var mysql       = require('mysql');
var log         = rootRequire(path.join('react', 'webpack', 'log.js'));
var abstract    = require(path.resolve(__dirname, 'db_spark_abstract.jsx'));

var connection;

var config      = require(path.resolve(__dirname, '..', 'db_config.js'));

const moment    = require('moment');

function db() {

    if (!connection) {

        connection = mysql.createConnection(config.db);

        connection.connect(function(err) {
            if (err) {
                throw 'error connecting: ' + err.stack;
            }
        });

        connection.query("SET NAMES 'UTF8'", function (error, results, fields) {
            if (error) throw error;
            // connected!
        });
    }

    return connection;
}

function extend(table, more) {
    function cache() {
        abstract.apply(this, arguments);
    }
    cache.prototype = Object.create(abstract.prototype);
    cache.prototype.constructor = cache;

    Object.assign(cache.prototype, more);

    return new cache(table, db());
}

module.exports = {
    cache: extend('spark_cache', {
        cachenew: function () {
            log('test')
        }
    }),
    db: db(),
    now: function () {
        return moment().format('YYYY-MM-DD HH:mm:ss');
    }
}