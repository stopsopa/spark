'use strict';

const path      = require('path');
const mysql     = require('mysql');
const Promise   = require("bluebird")
const log       = rootRequire(path.join('react', 'webpack', 'log.js'));

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
function isObject(a) {
    return (!!a) && (a.constructor === Object);
};

abstract.prototype.insert = function (list) {

    var query = 'INSERT INTO `'+ this.table+'` ';

    var columns = [], marks = [];

    for (var i in list) {
        columns.push('`' + i + '`');
        marks.push('?');
    }

    query += '(' + columns.join(', ') + ') values (' + marks.join(', ') + ')';

    return new Promise((resolve, reject) => {
        this.connection.query(query, values(list), function (error, results, fields) {
            error ? reject(error) : resolve(results.insertId);
        });
    });
}

abstract.prototype.update = function (list, id) {

    if (!isObject(id)) {
        id = {id: id};
    }

    var query = 'UPDATE `'+ this.table+'` SET ';

    var columns = [];

    for (var i in list) {
        columns.push('`' + i + '` = ?');
    }

    var ids = [];

    for (var i in id) {
        ids.push('`' + i + '` = ?')
    }

    query += columns.join(', ') + ' WHERE ' + ids.join(' AND ');

    return new Promise((resolve, reject) => {
        this.connection.query(query, values(list).concat(values(id)), function (error, results, fields) {
            error ? reject(error) : resolve(results);
        });
    });
}

abstract.prototype.select = function (id) {

    var query = 'SELECT * FROM `'+ this.table+'` ';

    if (id) {

        if (!isObject(id)) {
            id = {id: id};
        }

        var ids = [];

        for (var i in id) {
            ids.push('`' + i + '` = ?')
        }

        query += 'WHERE ' + ids.join(' AND ');
    }

    return new Promise((resolve, reject) => {
        this.connection.query(query, id && values(id), function (error, results, fields) {
            error ? reject(error) : resolve(results);
        });
    });
}

module.exports = abstract;
