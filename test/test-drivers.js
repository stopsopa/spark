'use strict';

const assert        = require('assert');
const path          = require('path');
const glob          = require("glob");
const fs            = require('fs');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire'))(__dirname, '..');

const overridetests = rootrequire('lib', 'overridetests');
const config        = rootrequire('test', 'config');
const log           = rootrequire('lib', 'log');

var engines = glob.sync(path.resolve(__dirname, '..', 'lib', 'db', '*')).filter((p) => {
    return fs.lstatSync(p).isDirectory();
}).map((path) => {
    return path.replace(/^.*\/([^\/]+)$/, '$1');
});

overridetests('database drivers tests', engines, (engine) => {

    const cnf = config.db[engine];

    if (process.env.TRAVIS) {
        delete cnf.password;
    }

    const driver        = rootrequire('lib', 'db', engine, 'driver');

    const db            = driver(cnf, config);

    describe('database tests', () => {

        it('wrong connection', function () {

            config.onlyfasttests && this.skip();

            this.timeout(3000);
            this.slow(2500);

            const test      = Object.assign({}, cnf, {
                host: '1.2.3.4'
            });

            const db        = driver(test);

            return db.cache.query('show tables').catch((err) => {
                assert.equal('connection error: Error: connect ETIMEDOUT', err.message);
            });
        });

        it('table exist', () => {
            return db.cache.tableExist().then((res) => {
                assert.equal(true, res);
            });
        });

        describe('parallel queries tests', () => {

            beforeEach(() => {
                return db.cache.truncate();
            });

            // node_modules/mocha/bin/mocha test/test-drivers.js
            // https://github.com/stopsopa/spark/commit/2de2e965b8cdac2da25b4216e635073491235f6a
            var again = (v) => {

                return () => {

                    it('try', () => {

                        var ids;

                        return db.cache.count()
                            .then((count) => {
                                assert.equal(0, count);
                                return Promise.all(
                                    '0123456789abcdefghijklmnoprstuwxyz'.split('')
                                        .map(i => db.cache.create(i + v))
                                );
                            })
                            .then((data) => {
                                ids = data.map(row => row.id);
                                return db.cache.count();
                            })
                            .then((count) => {
                                assert.equal(34, count);
                                return Promise.all(ids.map(id => db.cache.fetchOne(id)));
                            })
                            .then((ids) => {
                                // console.log('ids', ids)
                            })
                        ;
                    });
                }
            };

            function unique(pattern) {
                pattern || (pattern = 'xyxyxy');
                return pattern.replace(/[xy]/g,
                    function(c) {
                        var r = Math.random() * 16 | 0,
                            v = c == 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
            }

            '0123456789abcdefghijklmnoprstuwxyz'.split('')
                .forEach(i => describe('parallel queries ' + i, again(unique())));

            after(function() {
                return db.cache.truncate();
            });
        });

        describe('CRUD', () => {

            before(() => {
                return db.cache.truncate();
            });

            var id = 'test1';

            it('insert, find', () => {

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
                    excluded        : 0
                };

                return db.cache.insert(ins)
                    .then(() => db.cache.fetchOne(id)).then(function (data) {
                        delete data.lastTimeFound;
                        assert.deepEqual(ins, data);
                    });
            });

            it('find listed', () => {
                return db.cache.fetchOne(id, 'id, html').then((a) => {
                    assert.deepEqual({ id: 'test1', html: 'html' }, a)
                });
            });

            it('query id', () => {
                return db.cache.query('select html from :table: where id = :id', 'test1').then((data) => {
                    assert(data[0].html === 'html');
                });
            });

            it('query - param not found', () => {
                return db.cache.query('select html from :table: where id = :id and wrongparam = :wrongparam', {
                    id: 'test1'
                }).catch((e) => {
                    assert(
                        JSON.stringify(e),
                        `{"message":"general promise query try catch","error":"Param 'wrongparam' not found in object: {\"id\":\"test1\"} for request: select html from \`spark_cache\` where id = :id and wrongparam = :wrongparam"}`
                    );
                });
            });

            it('update no id', () => {
                return db.cache.update({
                    updateRequest: db.date()
                });
            });

            it('update, find', () => {

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
                    excluded        : 1
                };

                return db.cache.update(upd, id)
                    .then(() => db.cache.fetchOne(id))
                    .then((data) => {
                        upd.id = id;
                        delete data.lastTimeFound;
                        assert.deepEqual(upd, data);
                    });
            });

            it('count', () => {
                return db.cache.count().then((c) => {
                    assert(c === 1);
                });
            });

            it('fetchOne', () => {

                var id = '6jkfd84k5t8df';

                var ins = {
                    id: id,
                    html: '-html-',
                    url: 'http://url-'
                }

                return db.cache.insert(ins)
                    .then((data) => db.cache.fetchOne(id))
                    .then((data) => {

                        var tmp = {
                            id      : data.id,
                            html    : data.html,
                            url     : data.url
                        };

                        assert.deepEqual(ins, tmp);

                        return db.cache.fetchOne(id);
                    }).then((data) => {
                        assert(data.id === id);
                        return db.cache.find();
                    }).catch((e) => {
                        assert.deepEqual({
                            "message": "fetchOne query error",
                            "error": "found 2 rows"
                        }, e);
                    });
            });

            it('find different id', () => {
                return db.cache.fetchOne({
                    url: 'http://url-'
                })
                .catch((e) => {
                    assert.deepEqual({
                        message: 'fetchOne query error: found 2 rows',
                    }, e);
                });
            });

            it('count with params', () => {
                return db.cache.insert({
                    id              : 'additionid',
                    url             : 'http://url-for-count',
                    html            : 'other value'
                })
                .then(() => db.cache.count({
                    'html': '%html%'
                }, ['like']))
                .then((c) => {
                    assert.equal(2, c);
                });
            });

            it('count wrong', () => {
                return db.cache.count({
                    'wrongcolumn': '%html%'
                }).catch((e) => {
                    return e;
                });
            });

            it('query - in', () => {
                return db.cache.query("SELECT html FROM :table: WHERE id in (:ids)", {
                    ids: [id, '6jkfd84k5t8df']
                }).then((data) => {
                    assert.deepEqual([
                        { html: '-html-' },
                        { html: 'html-' }
                    ], data);
                });
            });

            it('syntax error', () => {
                return db.cache.query("SELECT SELECT * FROM :table:", {id:'test'})
                    .catch((e) => {
                        assert.deepEqual(
                            e.message,
                            "query error: Error: ER_PARSE_ERROR: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'SELECT * FROM `spark_cache`' at line 1"
                        );
                    });
            });

            it('trans', () => {

                var t = ['raz'];
                var r = db.cache.trans(t);

                assert.deepEqual(t, r)
            });

            it('count', () => {
                var id = 'additionid';
                return db.cache.count(id).then(function (row) {
                    assert(row === 1)
                });
            });

            it('find', () => {
                var id = 'additionid';
                return db.cache.find(id).then(function (row) {
                    assert(row.pop().id === id)
                });
            });

            it('find where', () => {
                var id = 'additionid';
                return db.cache.find({
                    url: 'http://url%'
                }, [
                    'like'
                ]).then(function (row) {
                    assert(row.length === 3)
                });
            });

        });
    });
});


