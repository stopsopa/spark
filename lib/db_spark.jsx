'use strict';

var path        = require('path');
var mysql       = require('mysql');
var log         = rootRequire(path.join('react', 'webpack', 'log.js'));
var abstract    = require(path.resolve(__dirname, 'db_spark_abstract.jsx'));

var connection;

var config      = require(path.resolve(__dirname, '..', 'db_config.js'));

function db() {

    if (!connection) {

        connection = mysql.createConnection(config.db);

        connection.connect(function(err) {

            if (err) {

                log('error connecting: ' + err.stack);
                return;
            }

            log('connected as id ' + connection.threadId);
        });

        connection.query("SET NAMES 'UTF8'", function (error, results, fields) {
            if (error) throw error;
            // connected!
        });
    }


    return connection;
}



module.exports = {
    cache: (function () {
        function cache() {
            abstract.apply(this, arguments);
        }
        cache.prototype = Object.create(abstract.prototype);
        cache.prototype.constructor = abstract;

        cache.prototype.cachenew = function () {
            log('cachenew')
        }

        return new cache('spark_cache', db());
    }()),
    test: {

        test: function (list) {
            db().query("SET NAMES 'UTF8'", function (error, results, fields) {
                if (error) throw error;
                // connected!
            })
        }
    },
    domain: {

    },
    settings: {

    }
}