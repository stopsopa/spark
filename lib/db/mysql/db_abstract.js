'use strict';

const path      = require('path');
const mysql     = require('mysql');

require(path.resolve(__dirname, '..', '..', 'rootrequire.js'))(__dirname, '..', '..', '..');
const log       = rootrequire('lib', 'log.js');

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
                    connection.query(query, queryParams, function (error, results, fields) {
                        connection && connection.release();
                        if (error) {
                            error.query = query;
                            error.params = queryParams;
                            reject({message:'query error', error:error})
                        }
                        else {
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

    var query = 'SELECT ' + select + ' FROM :table: WHERE `' + this.id + '` = :id';

    return this.query(query, {
        'id'        : id
    }).then(function (rows) {

        if (rows.length === 1) {
            return abstract.prototype.decode(rows[0]);
        }

        throw {message:'find query error', error:'found ' + rows.length + ' rows'};
    }, function (a) {
        return a
    });
};

abstract.prototype.fetchOne = function (query) {
    return this.query.apply(this, arguments).then(function (rows) {
        if (rows.length === 1) {
            return rows[0];
        }

        throw {message:'fetchOne query error', error:'found ' + rows.length + ' rows'}
    }, function (e) {
        return e;
    });
}

abstract.prototype.tableExist = function () {
    return this.query('show create table :table:').then(function (res) {
        return true;
    }, function (e) {
        return e;
    });
}

var decode = (function (p) {
    var date;
    return function (data) {
        if (typeof data === 'string' && data.length === 24 && p.test(data)) {
            date = data.substring(0, 19).split('');
            date[10] = ' ';
            return date.join('');
        }
        return data;
    }
}(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/))

abstract.prototype.decode = function (data) {

    if (isObject(data)) {

        data = Object.assign({}, data);

        for (var i in data) {
            data[i] = decode(data[i]);
        }
    }

    return data;
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
