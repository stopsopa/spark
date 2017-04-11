'use strict';

const path      = require('path');
const mysql     = require('mysql');
const log       = rootrequire(path.join('react', 'webpack', 'log.js'));

function abstract(table, id, pool) {
    this.table          = table;
    this.pool           = pool;
    this.id             = id;
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
 * @param query - use inside :table:
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

    if (query.indexOf(':table:') > -1) {
        query = query.replace(/:table:/g, '`' + this.table + '`');
    }

    if (isObject(params) && queryParams.length && query.indexOf(':') > -1) {

        var queryParams = [];

        query = query.replace(/:([a-z0-9]+)/ig, function (all, match) {

            if (typeof params[match] === 'undefined') {
                throw "Param '" + match + "' not found in object: " + JSON.stringify(params)
                    + ' for request: '+ query;
            }

            if (isArray(params[match])) {

                queryParams = queryParams.concat(params[match]);

                return '?,'.repeat(params[match].length - 1) + '?';
            }

            queryParams.push(params[match]);

            return '?';
        });

    }

    // log.line('query', query, queryParams)

    return new Promise((resolveParent, rejectParent) => {
        new Promise((resolve, reject) => {
            this.pool.getConnection(function(error, connection) {
                // log('connection.threadId: ', connection.threadId); // https://github.com/mysqljs/mysql#getting-the-connection-id
                if (error) {
                    connection && connection.release();
                    reject({message:'connection error', error:error})
                }
                else {
                    connection.query(query, queryParams, function (error, results, fields) {
                        connection && connection.release();
                        if (error) {
                            error.query = query;
                            error.params = queryParams;
                            reject({message:'query error', error:error})
                        }
                        else {
                            resolve(results);
                        }
                    });
                }
            })
        })
        .then(resolveParent, rejectParent)
        .catch(function (e) {
            rejectParent({message:'general promise query error', error:e})
        });
    })

}
/**
 * @param list - object
 */
abstract.prototype.insert = function (list) {

    var query = 'INSERT INTO :table: ';

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

    var query = 'UPDATE :table: SET ';

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

    var query = 'SELECT COUNT(*) AS c FROM :table:';

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
    }, function (a) {
        return a
    });
}

abstract.prototype.find = function (id) {

    const   args = Array.prototype.slice.call(arguments);
    let     select = args[1];

    if (args.length > 1) {
        if (typeof select !== 'string') {
            throw 'second argument of find method should be string';
        }
    }
    else {
        select = '*';
    }

    log.json(select);

    var query = 'SELECT ' + select + ' FROM :table: WHERE `' + this.id + '` = :id';

    log.line(query)

    return new Promise((resolve, reject) => {
        this.query(query, {
            'id'        : id
        }).then(function (rows) {

            if (rows.length === 1) {
                return resolve(rows[0]);
            }

            reject({message:'find query error', error:'found ' + rows.length + ' rows'})
        }, function (a) {
            return a
        });
    });
};

abstract.prototype.fetchOne = function (query) {
    return new Promise((resolve, reject) => {
        this.query.apply(this, arguments).then(function (rows) {
            if (rows.length === 1) {
                return resolve(rows[0]);
            }

            reject({message:'fetchOne query error', error:'found ' + rows.length + ' rows'})
        }, function (a) {
            return a
        });
    });
}

module.exports = abstract;
