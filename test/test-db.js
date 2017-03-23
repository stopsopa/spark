'use strict';

const assert        = require('assert');
const path          = require('path');
const glob          = require("glob");

require(path.resolve(__dirname, '..', 'lib', 'rootrequire.js'))(__dirname, '..');

const overridetests = rootrequire('lib', 'overridetests.js');
const config        = rootrequire('test', 'config.js');

var engines = glob.sync(path.resolve(__dirname, '..', 'lib', 'db', '*')).map(function (path) {
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
                assert.equal(true, res)
                done();
            });
        });

        describe('insert', function (done) {

            before(function () {
                db.cache.query('truncate :table:');
            });

            var id = 'test1';

            it('insert', function (done) {

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
                        assert.deepEqual(ins, data)
                        done();
                    }, log.json).catch(log.json);
                }, log.json).catch(log.json);

            });

            it('update', function (done) {

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

                        assert.deepEqual(upd, data)
                        done();
                    }, log.json).catch(log.json);
                }, log.json).catch(log.json);
            });
        });

        // describe('update', function () {
        //
        //     beforeEach(function () {
        //         db.cache.query('truncate :table:');
        //     });
        //
        // });
    });
});


