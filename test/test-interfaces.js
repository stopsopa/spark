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

overridetests('database interfaces tests', engines, function (engine) {

    const cnf = config.db[engine];

    if (process.env.TRAVIS) {
        delete cnf.password;
    }

    const driver        = rootrequire('lib', 'db', engine, 'driver.js');

    const db            = driver(cnf, config);

    describe('interfaces tests', function () {

        before(function () {
            db.cache.truncate();
        });

        it('create', function () {

            var url = 'http://domain.com/directory/file';

            return Promise.all([
                db.cache.create(url + '1'),
                db.cache.create(url + '2')
            ]).then((ids) => Promise.all(ids.map(function (r) {
                return db.cache.find(r.id);
            }))).then(function (data) {
                data.forEach(function (d) {
                    assert(db.hash(d.url) === d.id);
                    assert(d.html === null);
                    assert(d.updated === null);
                    assert(d.statusCode === null);
                    assert(d.json === null);
                    assert(d.warning === null);
                    assert(d.errorCounter === null);
                    assert(d.block === 0);
                    assert(d.created.toISOString().length === 24);
                    assert(d.updateRequest.toISOString().length === 24);
                    assert(d.lastTimeFound.toISOString().length === 24);
                });
            });

        });

        it('success', function () {

            var url = 'http://domain.com/directory/file2';

            var hash = db.hash(url);

            var before;

            return db.cache.find(hash)
                .then((d) => {
                    before = d;
                    return db.cache.success(hash, {json:true}, 'html:5');
                })
                .then((d) => db.cache.find(hash))
                .then((d) => {

                    assert(hash === d.id);
                    assert(d.html === 'html:5');
                    assert(url, d.url);

                    assert(before.created.toISOString() === d.created.toISOString());

                    assert(before.lastTimeFound.toISOString() === d.lastTimeFound.toISOString());

                    assert(before.updated === null);

                    assert(d.updated.toISOString().length === 24); // now it's date

                    assert(d.updateRequest === null); // now it's null

                    assert(d.statusCode === 200);

                    assert.deepEqual({json:true}, JSON.parse(d.json));

                    assert(d.warning === null);
                    assert(d.errorCounter === null);
                    assert(d.block === 0);
                });
        })

        it('error', function () {

            var url = 'http://domain.com/directory/file3';

            var hash = db.hash(url);

            return db.cache.create(url)
                .then(() => db.cache.error(hash, 501, {error:'wrong1'}, 'html:error1'))
                .then(() => db.cache.error(hash, 502, {error:'wrong2'}, 'html:error2'))
                .then(() => db.cache.find(hash))
                .then((d) => {
                    assert(db.hash(d.url) === hash);
                    assert(d.html === 'html:error2');
                    assert(d.updated.toISOString().length === 24);
                    assert(d.created.toISOString().length === 24);
                    assert(d.statusCode === 502);
                    assert.deepEqual(JSON.parse(d.json), {error:'wrong2'});
                    assert(d.warning === null);
                    assert(d.errorCounter === 2);
                    assert(d.block === 0);
                    assert(d.updateRequest === null);
                    assert(d.lastTimeFound.toISOString().length === 24);
                });
        })
    });
});


