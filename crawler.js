'use strict';

const path          = require('path');
const http          = require('http');
const process       = require('process');

require(path.resolve(__dirname, 'lib', 'rootrequire.js'))(__dirname, '.');

const log           = rootrequire('lib', 'log.js');

const config        = rootrequire(process.argv[2] || 'config');

const spark         = rootrequire('lib', 'curljson.js')(config.parser).spark;

const driver        = rootrequire('lib', 'db', 'mysql', 'driver.js');
const cnf           = config.db.mysql;
const db            = driver(cnf);

function insertNewLinks(origin, list, callback) {

    list = [].concat(list); // need to work on copy

    if (!list || !list.length) {
        return callback();
    }

    (function pop() {

        var url = list.pop();

        if (url) {
            db.cache.create(origin + url).then(pop, function (d) {
                if (d.error.code !== 'ER_DUP_ENTRY') {
                    log.json(d)
                }
                pop();
            });
        }
        else {
            callback();
        }
    }())
}

var emercounter = 0;
var emergency = false;
var free = false; // false on start
function crawl() {

    if (emergency) {
        emercounter += 1;
    }

    if (emercounter > 5) {

        log(db.now(), 'emergency crawl, couter:' + emercounter);

        var emercounter = 0;
        var emergency = false;
        return;
    }

    db.cache.fetch()
        .then(function (row) {

            log(db.now(), ' - ' + process.pid + ' ', row.url);

            row.url += '?_prerender';

            spark(row.url)
                .then(function (res) {

                    var list = [], origin;

                    try {
                        list    = res.json.internalLinks.links;
                        origin  = res.json.internalLinks.origin;
                    }
                    catch (e) {
                    }

                    var html = '';
                    try {
                        if (res.json.html) {
                            html = res.json.html;
                        }
                        delete res.json.html;
                    }
                    catch (e) {
                    }

                    try {

                        if (res.statusCode === 200) {
                            insertNewLinks(origin, list, function () {
                                db.cache.success(row.id, res.json, html)
                                    .then(function (res) {

                                        emergency = false;
                                        emercounter = 0;

                                        setTimeout(function() {
                                            free = true
                                        }, config.crawler.waitBeforeCrawlNextPage);

                                    }, function (e) {
                                        log.json('error')
                                        log.json(e)
                                        log.json(upd)
                                    });
                            });
                        }
                        else {
                            db.cache.error(row.id, res.statusCode, res.json, html)
                                .then(function (res) {
                                    setTimeout(function() {
                                        free = true
                                    }, config.crawler.waitBeforeCrawlNextPage);
                                }, function (e) {
                                    log.json('error')
                                    log.json(e)
                                    setTimeout(function() {
                                        free = true
                                    }, config.crawler.waitBeforeCrawlNextPage);
                                });
                        }
                    }
                    catch (e) {
                        log(e)
                    }
                }, function (e) {
                    log.line('spark cant crawl : ' + row.url, JSON.stringify(e));

                    if (!emergency) {
                        emercounter = 0;
                    }

                    emergency = true;

                    setTimeout(function() {
                        free = true
                    }, config.crawler.continueIdleAfter);

                    // @todo - send email
                })
                .catch(function (e) {
                    log.json(e)
                });

        }, function (e) {
            if (e.error === 'found 0 rows') {
                setTimeout(function() {
                    free = true
                }, config.crawler.continueIdleAfter);
            }
            else {
                log.json(e)
            }
        });
}

log(db.now(), 'start...');

setInterval(function () {
    if (free) {
        free = false;
        crawl();
    }
}, 100);

(function () {
    function run() {

        var now = db.now();

        log(now, 'reset updateRequest');

        db.cache.query('update spark_cache set updateRequest = FROM_UNIXTIME(UNIX_TIMESTAMP() + (100000 - length(url)))');

        setTimeout(function() {
            free = true
        }, config.crawler.continueIdleAfter);
    }
    run();
    setInterval(run, 3 * 60 * 60 * 1000); // 10800000
}());
