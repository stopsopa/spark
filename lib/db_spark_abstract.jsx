'use strict';

var path        = require('path');
var mysql       = require('mysql');
var Promise     = require("bluebird")
var log         = rootRequire(path.join('react', 'webpack', 'log.js'));

function abstract(table, connection) {
    this.table          = table;
    this.connection     = connection;
}

function values(object) {
    var list = [];
    for (var i in object) {
        list.push(object[i]);
    }
    return list;
}

abstract.prototype.create = function (list) {

    var query = 'INSERT INTO `'+ this.table+'` ';

    var columns = [], marks = [];

    for (var i in list) {
        columns.push('`' + i + '`');
        marks.push('?');
    }

    query += '(' + columns.join(', ') + ') values (' + marks.join(', ') + ')';

    return new Promise((resolve, reject) => {
        this.connection.query(query, values(list), function (error, results, fields) {
            if (error) throw error;
            resolve(results.insertId);
        });
    });
}

module.exports = abstract;
