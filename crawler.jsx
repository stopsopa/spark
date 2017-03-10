'use strict';

// select id, url, created, updated, updateRequest, statusCode, warning, errorCounter from spark_cache

const path          = require('path');
require(path.resolve(__dirname, 'lib', 'rootrequire.jsx'))(__dirname, '.');

const http          = require('http');
const sha1          = require('sha1');
const log           = rootrequire(path.join('lib', 'log.jsx'));
const spark         = rootrequire(path.join('lib', 'curljson.jsx')).spark;
const db            = rootrequire(path.join('lib', 'db_spark.jsx'));
const config        = rootrequire(path.join('config'));

function hash(url) {

    if (/^https?:\/\//i.test(url)) {
        url = url.replace(/^https?:\/\/[^\/\?\#&=]+(.*)$/i, '$1');
    }

    return sha1(url);
}

function searchForWarning(json) {
    return null;
}

function insertNewLinks(origin, list, callback) {

    if (!list || !list.length) {
        return callback();
    }

    (function pop() {
        var url = list.pop();

        if (url) {
            db.cache.insert({
                id: hash(url),
                url: origin + url,
                created: db.now(),
                html: ''
            })
            .then(pop, function (d) {
                try {
                    if (d.error.code !== 'ER_DUP_ENTRY') {
                        log.json(d)
                    }
                }
                catch (e) {
                    log.json(e)
                }
                pop();
            })
            .catch(function (e) {
                log.json(e)
            });
        }
        else {
            callback();
        }
    }())
}

var free = true;
function crawl() {

    db.cache.fetchOne("select * from :table: WHERE updateRequest is not null ORDER BY updateRequest DESC LIMIT 1")
        .then(function (row) {

            row.url += '?_noprerender';

            log(db.now(), row.url);

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

                    if (res.statusCode === 200) {

                        insertNewLinks(origin, list, function () {

                            var upd = {
                                html            : html || '',
                                updated         : db.now(),
                                statusCode      : res.statusCode,
                                updateRequest     : null,
                                json            : JSON.stringify(res.json, null, '  ') || '-empty-',
                                warning         : searchForWarning(res.json),
                                errorCounter    : null
                            };

                            db.cache.update(upd, row.id)
                                .then(function (res) {
                                    setTimeout(function() {
                                        free = true
                                    }, config.crawler.waitBeforeCrawlNextPage);
                                }, function (e) {
                                    log.json('error')
                                    log.json(e)
                                    log.json(upd)
                                })
                                .catch(function () {
                                    log.json('error')
                                    log.json(e)
                                });
                        });
                    }
                    else {
                        db.cache.query(`
UPDATE :table: SET  html            = :html,
                    updated         = :updated,
                    statusCode      = :statusCode,
                    updateRequest     = null,
                    json            = :json,
                    warning         = null,
                    errorCounter    = if(errorCounter, errorCounter, 0) + 1
WHERE               id = :id                         
`,                      {
                            id          : row.id,
                            html        : html || '',
                            updated     : db.now(),
                            updateRequest     : null,
                            statusCode  : res.statusCode,
                            json        : JSON.stringify(res.json, null, '  ') || '-empty-'
                        })
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
                        })
                        .catch(function (e) {
                            log.json('error')
                            log.json(e)
                            setTimeout(function() {
                                free = true
                            }, config.crawler.waitBeforeCrawlNextPage);
                        });
                    }
                }, function (e) {
                    log.line('spark cant crawl : ' + row.url, e);

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
        })
        .catch(function (e) {
            log.json(e)
            setTimeout(function() {
                free = true
            }, config.crawler.continueIdleAfter);
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

        db.cache.query('update :table: set updateRequest = :now', {
            now: now
        });
    }
    run();
    setInterval(run, 3 * 60 * 60 * 1000); // 10800000
}());
