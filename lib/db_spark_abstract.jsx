'use strict';

const path      = require('path');
const mysql     = require('mysql');
const Promise   = require("bluebird")
const log       = rootRequire(path.join('react', 'webpack', 'log.js'));

function abstract(table, pool) {
    this.table          = table;
    this.pool           = pool;
}
function isObject(a) {
    return (!!a) && (a.constructor === Object);
};
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

function values(object) {
    if (isArray(object)) {
        return object;
    }
    var list = [];
    if (object) {
        for (var i in object) {
            list.push(object[i]);
        }
    }
    return list;
};
/**
 * db.cache.query("select * from spark_cache where id in (:id) or id = :dwa", {id: ['idhash1487540603903', 'idhash'], dwa: 'idhash1487540568037'})
 * .then(function (res) {
 *     log(res)
 * }, function (rej) {
 *     log('rej', rej)
 * })
 *
 * @param query
 * @param object (if ":col_name" inside) | array (if '?' used inside)
 *
 * return
 * { - example for update
        fieldCount: 0,
        affectedRows: 1,    - for DELETE https://github.com/mysqljs/mysql#getting-the-number-of-affected-rows
        insertId: 0,        - for INSERT https://github.com/mysqljs/mysql#getting-the-id-of-an-inserted-row
        changedRows: 1      - for UPDATE https://github.com/mysqljs/mysql#getting-the-number-of-changed-rows
        serverStatus: 2,
        warningCount: 0,
        message: '(Rows matched: 1  Changed: 1  Warnings: 0',
        protocol41: true,
    }
 */
abstract.prototype.query = function (query) {

    var params = (arguments.length > 0) ? arguments[1] : false;

    if (params) {
        if (!isArray(params) && !isObject(params)) {
            params = {id: params};
        }
    }

    var queryParams = values(params);

    if (isObject(params) && queryParams.length && query.indexOf(':') > -1) {

        var queryParams = [];

        query = query.replace(/:([a-z0-9]+)/ig, function (all, match) {

            if (!params[match]) {
                throw "Param '" + match + "' not found in object: " + JSON.stringify(params);
            }

            if (isArray(params[match])) {

                queryParams = queryParams.concat(params[match]);

                return '?,'.repeat(params[match].length - 1) + '?';
            }

            queryParams.push(params[match]);

            return '?';
        });

        log('query', query, queryParams)
    }

    return new Promise((resolve, reject) => {
        this.pool.getConnection(function(error, connection) {
            log('connection.threadId: ', connection.threadId); // https://github.com/mysqljs/mysql#getting-the-connection-id
            if (error) {
                connection && connection.release();
                reject({message:'connection error', error:error})
            }
            else {
                connection.query(query, queryParams, function (error, results, fields) {
                    connection && connection.release();
                    error ? reject({message:'query error', error:error}) : resolve(results);
                });
            }
        })
    });
}
/**
 * @param list - object
 */
abstract.prototype.insert = function (list) {

    var query = 'INSERT INTO `'+ this.table+'` ';

    var columns = [], marks = [];

    for (var i in list) {
        columns.push('`' + i + '`');
        marks.push('?');
    }

    query += '(' + columns.join(', ') + ') values (' + marks.join(', ') + ')';

    return this.query(query, list);
}
/**
 * @param list - object
 * @param id - mixed | object
 */
abstract.prototype.update = function (list, id) {

    if (!id) {
        id = false;
    }

    if (id && !isObject(id)) {
        id = {id: id};
    }

    var query = 'UPDATE `'+ this.table+'` SET ';

    var columns = [];

    for (var i in list) {
        columns.push('`' + i + '` = ?');
    }

    var ids = [];

    if (id) {
        for (var i in id) {
            ids.push('`' + i + '` = ?')
        }
    }

    query += columns.join(', ') + ' WHERE ' + ids.join(' AND ');

    return this.query(query, values(list).concat(values(id)));
}
/**
    db.cache.count({
        url: 'http://urlchanged updated'
    }).then(function (count) {
        log('count: ', count)
    })
 */
abstract.prototype.count = function () {

    var params = (arguments.length > -1) ? arguments[0] : false;

    var query = 'SELECT COUNT(*) AS c FROM `' + this.table + '`';

    if (params) {

        var columns = [];

        for (var i in params) {
            columns.push('`' + i + '` = ?');
        }

        query += ' WHERE ' + columns.join(' AND ');
    }

    return this.query(query, values(params)).then(function (rows) {

        if (rows.length > 0 && rows[0].c) {

            return rows[0].c;
        }

        throw "Count(*) not work for query: '" + query + "'";
    });
}

module.exports = abstract;
