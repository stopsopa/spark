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

    const db = rootrequire('lib', 'db', engine, 'driver.js')(cnf);

    const log           = rootrequire('lib', 'log.js');

    describe('database tests', function () {

        it('table exist', function (done) {
            db.cache.tableExist().then(function (res) {

                assert.equal(true, res);

                done();

            }, log);
        });

        describe('insert, update, find, count', function (done) {

            before(function () {
                db.cache.query('truncate :table:');
            });

            var id = 'test1';

            it('insert, find', function (done) {

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

                db.cache.insert(ins).then(function () {
                    db.cache.find(id).then(function (data) {

                        assert.deepEqual(ins, data);

                        done();

                    }, log);
                }, log);

            });

            it('query id', function (done) {
                db.cache.query('select html from :table: where id = :id', 'test1').then(function (data) {
                    assert(data[0].html === 'html');
                    done();
                }, log);
            });

            it('query - param not found', function (done) {
                db.cache.query('select html from :table: where id = :id and wrongparam = :wrongparam', {
                    id: 'test1'
                }).then(function (data) {
                    log('do true', data)
                }, function (e) {
                    assert(
                        JSON.stringify(e),
                        `{"message":"general promise query try catch","error":"Param 'wrongparam' not found in object: {\"id\":\"test1\"} for request: select html from \`spark_cache\` where id = :id and wrongparam = :wrongparam"}`
                    );
                    done();
                });
            });

            it('update, find', function (done) {

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

                db.cache.update(upd, id).then(function () {
                    db.cache.find(id).then(function (data) {

                        upd.id = id;

                        assert.deepEqual(upd, data);

                        done();

                    }, log);
                }, log);
            });

            it('count', function () {
               return db.cache.count().then(function (c) {
                   assert(c === 1)
               }, log);
            });

            it('fetchOne', function (done) {

                // this.timeout(4000)

                var id = '6jkfd84k5t8df';

                var ins = {
                    id: id,
                    html: '-html-',
                    url: 'http://url-'
                }

                db.cache.insert(ins).then(function () {
                    db.cache.find(id).then(function (data) {

                        var tmp = {
                            id      : data.id,
                            html    : data.html,
                            url     : data.url
                        };

                        assert.deepEqual(ins, tmp);

                        db.cache.fetchOne('select * from :table: where id = :id', {
                            id: id
                        }).then(function (data) {

                            assert(data.id === id);

                            db.cache.fetchOne('select * from :table:').then(function (e) {
                                log('e', e)
                            }, function (e) {
                                assert.deepEqual({
                                    "message": "fetchOne query error",
                                    "error": "found 2 rows"
                                }, e);
                                done();
                            });
                        }, log);
                    }, log);
                }, log);
            });


        });
    });
});


