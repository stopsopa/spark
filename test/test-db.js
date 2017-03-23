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

            beforeEach(function () {
                db.cache.query('truncate :table:');
            });

            it('insert', function (done) {

                var id = 'test1';

                var upd = {
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

                db.cache.insert(upd).then(function (res) {
                    db.cache.find(id).then(function (data) {
                        assert.deepEqual(upd, data)
                        done();
                    }, function (e) {
                        log.json(e)
                    }).catch(function (e) {
                        log.json(e)
                    });
                }, function (e) {
                    done(e);
                    log.json(e)
                }).catch(function (e) {
                    done(e);
                    log.json(e)
                });

            });
        });
    });
});


