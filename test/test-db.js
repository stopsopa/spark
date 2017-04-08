'use strict';

const assert        = require('assert');
const path          = require('path');
const glob          = require("glob");
const fs            = require('fs');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire.js'))(__dirname, '..');

const overridetests = rootrequire('lib', 'overridetests.js');
const config        = rootrequire('test', 'config.js');
const log           = rootrequire('lib', 'log.js');

var engines = glob.sync(path.resolve(__dirname, '..', 'lib', 'db', '*')).filter(function (p) {
    return fs.lstatSync(p).isDirectory();
}).map(function (path) {
    return path.replace(/^.*\/([^\/]+)$/, '$1');
});

overridetests('database drivers tests', engines, function (engine) {

    const cnf = config.db[engine];

    if (process.env.TRAVIS) {
        delete cnf.password;
    }

    const driver        = rootrequire('lib', 'db', engine, 'driver.js');

    const db            = driver(cnf);

    describe('database tests', function () {

        it('wrong connection', function () {

            this.timeout(3000);

            const test      = Object.assign({}, cnf, {
                host: '1.2.3.4'
            });

            const db        = driver(test);

            return db.cache.query('show tables').catch(function (err) {
                assert.equal('connection error', err.message);
            });
        });

        it('table exist', function () {
            return db.cache.tableExist().then(function (res) {
                assert.equal(true, res);
            });
        });

        describe('insert, update, find, count', function (done) {

            before(function () {
                db.cache.query('truncate :table:');
            });

            var id = 'test1';

            it('insert, find', function () {

                var ins = {
                    id              : id,
                    url             : 'http://url',
                    html            : 'html',
                    created         : db.date(),
                    updated         : db.date(),
                    updateRequest   : null,
                    statusCode      : 200,
                    json            : JSON.stringify({test:'data'}, null, '  ') || '-empty-',
                    warning         : 'test',
                    errorCounter    : 6,
                    block           : 0
                };

                return db.cache.insert(ins).then(function () {
                    return db.cache.find(id);
                }).then(function (data) {
                    assert.deepEqual(ins, data);
                });
            });

            it('find listed', function () {
                return db.cache.find(id, 'id, html').then(function (a) {
                    assert.deepEqual({ id: 'test1', html: 'html' }, a)
                });
            });

            it('query id', function () {
                return db.cache.query('select html from :table: where id = :id', 'test1').then(function (data) {
                    assert(data[0].html === 'html');
                });
            });

            it('query - param not found', function () {
                return db.cache.query('select html from :table: where id = :id and wrongparam = :wrongparam', {
                    id: 'test1'
                }).catch(function (e) {
                    assert(
                        JSON.stringify(e),
                        `{"message":"general promise query try catch","error":"Param 'wrongparam' not found in object: {\"id\":\"test1\"} for request: select html from \`spark_cache\` where id = :id and wrongparam = :wrongparam"}`
                    );
                });
            });

            it('update no id', function () {
                return db.cache.update({
                    updateRequest: db.date()
                });
            });

            it('update, find', function () {

                var upd = {
                    url             : 'http://url-',
                    html            : 'html-',
                    created         : null,
                    updated         : null,
                    updateRequest   : db.date(),
                    statusCode      : 301,
                    json            : null,
                    warning         : null,
                    errorCounter    : 0,
                    block           : 1
                };

                return db.cache.update(upd, id).then(function () {
                    return db.cache.find(id);
                }).then(function (data) {
                    upd.id = id;
                    assert.deepEqual(upd, data);
                });
            });

            it('count', function () {
                return db.cache.count().then(function (c) {
                    assert(c === 1)
                });
            });

            it('fetchOne', function () {

                var id = '6jkfd84k5t8df';

                var ins = {
                    id: id,
                    html: '-html-',
                    url: 'http://url-'
                }

                return db.cache.insert(ins).then(function (data) {
                    return db.cache.find(id);
                }).then(function (data) {

                    var tmp = {
                        id      : data.id,
                        html    : data.html,
                        url     : data.url
                    };

                    assert.deepEqual(ins, tmp);

                    return db.cache.fetchOne('select * from :table: where id = :id', {
                        id: id
                    });
                }).then(function (data) {
                    assert(data.id === id);
                    return db.cache.fetchOne('select * from :table:')
                }).catch(function (e) {
                    assert.deepEqual({
                        "message": "fetchOne query error",
                        "error": "found 2 rows"
                    }, e);
                });
            });

            it('find different id', function () {
                return db.cache.find({
                    url: 'http://url-'
                })
                .catch(function (e) {
                    assert.deepEqual({
                        error: 'found 2 rows',
                        message: 'find query error',
                    }, e);
                });
            });

            it('find wrong select', function () {
                return db.cache.find(id, []).catch(function (e) {
                    assert.deepEqual({
                        message: 'input error',
                        error: "second argument of find method should be string"
                    }, e)
                });
            });

            it('count with params', function () {
                return db.cache.insert({
                    id              : 'additionid',
                    url             : 'http://url-for-count',
                    html            : 'other value'
                }).then(function () {
                    return db.cache.count({
                        'html': '%html%'
                    }, ['like']);
                }, log).then(function (c) {
                    assert.equal(2, c);
                });
            });

            it('count wrong', function () {
                return db.cache.count({
                    'wrongcolumn': '%html%'
                }).catch(function (e) {
                    return e;
                });
            });

            it('query - in', function () {
                return db.cache.query("SELECT html FROM :table: WHERE id in (:ids)", {
                    ids: [id, '6jkfd84k5t8df']
                }).then((data) => {
                    assert.deepEqual([
                        { html: '-html-' },
                        { html: 'html-' }
                    ], data);
                });
            });

            it('syntax error', function () {
                return db.cache.query("SELECT SELECT * FROM :table:", {id:'test'}).then(log, function (e) {
                    assert.deepEqual({
                        message: e.message,
                        error: {
                            query: e.error.query,
                            params: e.error.params
                        }
                    }, {
                        message: 'query error',
                        error: {
                            query: 'SELECT SELECT * FROM `spark_cache`',
                            params: {id: 'test'}
                        }
                    });
                });
            });



        });
    });
});


