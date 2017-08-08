'use strict';

const path          = require('path');
const mysql         = require('mysql');

require(path.resolve(__dirname, '..', '..', 'rootrequire'))(__dirname, '..', '..', '..');
const log           = rootrequire('lib', 'log');
const arglib        = rootrequire('lib', 'args');

function abstract(table, id, pool) {
    this.table          = table;
    this.pool           = pool;
    this.id             = id;
}
function isObject(a) {
    // return (!!a) && (a.constructor === Object);
    return Object.prototype.toString.call(a) === '[object Object]'; // better in node.js to dealing with RowDataPacket object
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
 * WARNING: method doesn't work with simultanious queries, for example for two 'insert' queries it's sometimes gonna create only second row in db
 *          this is not issue in this project because all db traffic is queued, but can be in other.
 *          I didn't predicted this case :/, I think it can be fixed but if i'm gonna do this, i'm gonna do this later
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

    return new Promise((resolve, reject) => {
        try {

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

            this.pool.getConnection(function(error, connection) {
                // log('connection.threadId: ', connection.threadId); // https://github.com/mysqljs/mysql#getting-the-connection-id
                if (error) {
                    connection && connection.release();
                    reject({message:'connection error', error:error})
                }
                else {
                    //log.log(query, queryParams)
                    connection.query(query, queryParams, function (error, results, fields) {
                        connection && connection.release();
                        if (error) {
                            error.query = query;
                            error.params = params;
                            reject({message:'query error', error:error})
                        }
                        else {
                            // resolve(results);
                            resolve(abstract.prototype.trans(results));
                        }
                    });
                }
            });


        }
        catch (e) {
            reject({message:'general promise query try catch', error:e});
        }
    });
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

    var data = values(list);

    var ids = [];

    if (id) {
        for (var i in id) {
            ids.push('`' + i + '` = ?')
        }
        data = data.concat(values(id));
    }

    query += columns.join(', ');

    if (ids.length) {
        query += ' WHERE ' + ids.join(' AND ');
    }

    return this.query(query, data);
}
/**
 *  db.cache.count(id) - usefull to 'exist'
    db.cache.count({
        url: 'contain html',
        id: 'not equal value'
    },['like', '!=']).then(function (count) {
        log('count: ', count)
    })
 */
abstract.prototype.count = function () {

    var params = (arguments.length > 0) ? arguments[0] : false;

    if (params && !isObject(params)) {
        var tmp = {};
        tmp[this.id] = params;
        params = tmp;
    }

    var cond  = (arguments.length > 1) ? arguments[1] : [];

    var query = 'SELECT COUNT(*) AS c FROM :table:';

    if (params) {

        var columns = [];

        var k = 0;
        for (var i in params) {
            columns.push('`' + i + '` ' + (cond[k] || '=') + ' ?');
            k += 1;
        }

        query += ' WHERE ' + columns.join(' AND ');
    }

    return this.query(query, values(params)).then(function (rows) {

        if (rows.length > 0 && rows[0].c) {

            return rows[0].c;
        }
    });
}

/**
 *  db.cache.find(id)
 *  db.cache.find('id, hash') -- wrong
 *  db.cache.find(id, 'id, hash')
    db.cache.find({
        url: 'contain html',
        id: 'not equal value'
    },['like', '!=']).then(function (count) {
        log('count: ', count)
    })
 */
abstract.prototype.find = function () {

    var alib = arglib(arguments);

    var params = alib.string.shift(alib.object.shift());

    if (params && !isObject(params)) {
        var tmp = {};
        tmp[this.id] = params;
        params = tmp;
    }

    var cond  = alib.array.shift([]);

    var query = 'SELECT ' + alib.string.shift("*") + ' FROM :table:';

    if (params) {

        var columns = [];

        var k = 0;
        for (var i in params) {
            columns.push('`' + i + '` ' + (cond[k] || '=') + ' ?');
            k += 1;
        }

        query += ' WHERE ' + columns.join(' AND ');
    }

    // log.log({
    //     query: query,
    //     params: values(params)
    // });

    return this.query(query, values(params));
};

abstract.prototype.truncate = function () {
    return this.query('truncate :table:');
};

/**
 * db.cache.findOne(id)
 * db.cache.findOne(id, 'hash, statusCode')
 * @param query
 * @returns {Promise}
 */
abstract.prototype.fetchOne = function (id, cols) {

    return new Promise((resolve, reject) => {

        this.query('SELECT ' + (cols || '*') + ' FROM :table: WHERE `' + this.id + '` = :id', {
            id: id
        }).then(function (rows) {

            if (rows.length === 1) {
                return resolve(rows[0]);
            }

            reject({message:'fetchOne query error', error:'found ' + rows.length + ' rows'});

        }, reject);

    });
}

abstract.prototype.tableExist = function () {
    return this.query('show create table :table:').then(function (res) {
        return true;
    });
}

abstract.prototype.trans = function (a) {

    if (isArray(a)) {
        return Array.prototype.slice.call(a).map(abstract.prototype.trans);
    }

    if (isObject(a)) {
        return Object.assign({}, a);
    }

    return a;
}

module.exports = abstract;
