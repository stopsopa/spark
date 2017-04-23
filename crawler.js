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

            url = origin + url;

            db.cache.create(url).then(pop, function (d) {
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

var inter = (function () {
    var handler;
    return function (time) {

        clearTimeout(handler);

        handler = setTimeout(crawl, time);
    };
}());

function crawl() {

    if (emergency) {
        emercounter += 1;
    }

    if (emercounter >= 6) {

        log(db.now(), 'emergency crawl, couter:' + emercounter);

        emercounter = 0;
        emergency = false;
        return;
    }

    db.cache.fetch()
        .then(function (row) {

            if (!row) {
                log('inter - nothing to crawl');
                return inter(config.crawler.continueIdleAfter);
            }

            log(db.now(), ' - ' + process.pid + ' ', row.url);


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

                                        log.line('inter');
                                        inter(config.crawler.waitBeforeCrawlNextPage);

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
                                    log('inter');
                                    inter(config.crawler.waitBeforeCrawlNextPage);
                                }, function (e) {
                                    log.json('error');
                                    log.json(e);
                                    log.line('inter');
                                    inter(config.crawler.waitBeforeCrawlNextPage);
                                });
                        }
                    }
                    catch (e) {
                        log(e)
                    }
                }, function (e) {

                    log.line("spark can't crawl : " + row.url, JSON.stringify(e));

                    if (!emergency) {
                        emercounter = 0;
                    }

                    emergency = true;

                    log.line('inter');
                    inter(config.crawler.continueIdleAfter);

                    // @todo - send email
                });

        }, function (e) {
            if (e.error === 'found 0 rows') {
                log.line('inter');
                inter(config.crawler.continueIdleAfter);
            }
            else {
                log.json(e)
            }
        });
}

log(db.now(), 'start...');

(function () {
    function run() {

        var now = db.now();

        log(now, 'reset updateRequest');

        db.cache.query('update spark_cache set updateRequest = FROM_UNIXTIME(UNIX_TIMESTAMP() + (100000 - length(url)))')
            .then(() => {
                log('inter');
                inter(config.crawler.continueIdleAfter);
            });
    }
    run();
    setInterval(run, 3 * 60 * 60 * 1000); // 10800000
}());
