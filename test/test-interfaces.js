'use strict';

const assert        = require('assert');
const path          = require('path');
const glob          = require("glob");
const fs            = require('fs');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire.js'))(__dirname, '..');

const overridetests = rootrequire('lib', 'overridetests.js');
const config        = rootrequire('test', 'config.js');
const log           = rootrequire('lib', 'log.js');
const delay         = rootrequire('test', 'delay.js');

var engines = glob.sync(path.resolve(__dirname, '..', 'lib', 'db', '*')).filter((p) => {
    return fs.lstatSync(p).isDirectory();
}).map((path) => {
    return path.replace(/^.*\/([^\/]+)$/, '$1');
});

overridetests('database interfaces tests', engines, (engine) => {

    const cnf = config.db[engine];

    if (process.env.TRAVIS) {
        delete cnf.password;
    }

    const driver        = rootrequire('lib', 'db', engine, 'driver.js');

    const db            = driver(cnf, config);

    describe('interfaces tests', () => {

        before(() => {
            db.cache.truncate();
        });

        it('create', () => {

            var url = 'http://domain.com/directory/file';

            return Promise.all([
                db.cache.create(url + '1'),
                db.cache.create(url + '2')
            ]).then((ids) => Promise.all(ids.map((r) => {
                return db.cache.fetchOne(r.id);
            }))).then((data) => {
                data.forEach((d) => {
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

        it('success', () => {

            var url = 'http://domain.com/directory/file2';

            var hash = db.hash(url);

            var before;

            return db.cache.fetchOne(hash)
                .then((d) => {
                    before = d;
                    return db.cache.success(hash, {json:true}, 'html:5');
                })
                .then((d) => db.cache.fetchOne(hash))
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

        it('error', () => {

            var url = 'http://domain.com/directory/file3';

            var hash = db.hash(url);

            return db.cache.create(url)
                .then(() => db.cache.error(hash, 501, {error:'wrong1'}, 'html:error1'))
                .then(() => db.cache.error(hash, 502, {error:'wrong2'}, 'html:error2'))
                .then(() => db.cache.fetchOne(hash))
                .then((d) => {
                    assert(db.hash(d.url) === hash);
                    assert(d.html === 'html:error2');
                    assert(d.updated.toISOString().length === 24);
                    assert(d.created.toISOString().length === 24);
                    assert(d.statusCode === 502);
                    assert.deepEqual(JSON.parse(d.json), {error:'wrong2'});
                    assert(d.warning === null);
                    assert(d.errorCounter === 2); // most important
                    assert(d.block === 0);
                    assert(d.updateRequest === null);
                    assert(d.lastTimeFound.toISOString().length === 24);
                });
        })

        it('hash', () => {
            try {
                db.hash('string');
                assert(false);
            } catch (e) {
                assert(e === "Can't generate hash for url: 'string' must match /^https?:\/\/.+/");
            }
        });

        it('fetch', function () {

            this.timeout(4000);

            var tmp = [
                'http://domain.com/one',
                'http://domain.com/two',
                'http://domain.com/three',
            ];

            var urls = [].concat(tmp);

            return db.cache.create(urls.shift())
                .then(() => delay(1000))
                .then(() => db.cache.create(urls.shift()))
                .then(() => delay(1000))
                .then(() => db.cache.create(urls.shift()))
                .then(() => db.cache.fetch())
                .then((row) => {
                    assert(row.url === tmp[2]);
                    return db.cache.success(row.id, {}, 'html success');
                })
                .then(() => db.cache.fetch())
                .then((row) => {
                    assert(row.url === tmp[1]);
                    return db.cache.error(row.id, 500, {status:500}, 'html: 500');
                })
                .then(() => db.cache.fetch())
                .then((row) => {
                    assert(row.url === tmp[0]);
                    return db.cache.success(row.id, {}, 'html success 2');
                })
                .then(() => db.cache.fetch())
                .then((row) => {
                    assert(row.url === 'http://domain.com/directory/file1');
                    return db.cache.success(row.id, {}, 'html success 3');
                })
                .then(() => db.cache.fetch())
                .then((row) => {
                    assert(row === null);
                })
        });

    });
});


