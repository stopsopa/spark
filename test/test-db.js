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
    });

    describe('engine test suites', function () {
        it('first test', function () {
            assert.equal('true', 'true');
        });
    });
});


