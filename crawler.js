'use strict';

const path          = require('path');
const http          = require('http');
const process       = require('process');
const sha1          = require('sha1');


require(path.resolve(__dirname, 'lib', 'rootrequire.js'))(__dirname, '.');

const log           = rootrequire('lib', 'log.js');
const spark         = rootrequire('lib', 'curljson.js').spark;
const dbprovider    = rootrequire('lib', 'db', 'mysql', 'db_spark.js');
const config        = rootrequire('config')[process.argv[2]];

const db            = dbprovider(config);

log(db.now(), ' start crawler: ' + process.argv[2]);

function hash(url) {

    if ( ! /^https?:\/\//i.test(url)) {
        throw "url: '"+url+"' is not correct";
    }

    return sha1(url);
}

function searchForWarning(json) {
    return null;
}

function insertNewLinks(origin, list, callback) {

    list = [].concat(list); // need to work on copy

    if (!list || !list.length) {
        return callback();
    }

    (function pop() {
        var url = list.pop();


        if (url) {
            url = origin + url;

            db.cache.insert({
                id: hash(url),
                url: url,
                created: db.now(),
                updateRequest: db.now(),
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

    if (emercounter > 5) {

        log(db.now(), 'emergency crawl, couter:' + emercounter);

        emercounter = 0;
        emergency = false;
        return;
    }

    db.cache.fetchOne("SELECT * FROM :table: WHERE updateRequest IS NOT NULL ORDER BY updateRequest DESC LIMIT 1")
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

                    if (res.statusCode === 200) {

                        insertNewLinks(origin, list, function () {

                            var upd = {
                                html            : html || '',
                                updated         : db.now(),
                                statusCode      : res.statusCode,
                                updateRequest   : null,
                                json            : JSON.stringify(res.json, null, '  ') || '-empty-',
                                warning         : searchForWarning(res.json),
                                errorCounter    : null
                            };

                            db.cache.update(upd, row.id)
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
                            log.line('inter');
                            inter(config.crawler.waitBeforeCrawlNextPage);
                        }, function (e) {
                            log.json('error');
                            log.json(e);
                            log.line('inter');
                            inter(config.crawler.waitBeforeCrawlNextPage);
                        });
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

        db.cache.query('update :table: set updateRequest = FROM_UNIXTIME(UNIX_TIMESTAMP() + (100000 - length(url)))').then(function () {

            log.line('inter');

            inter(config.crawler.continueIdleAfter);
        });
    }
    run();
    setInterval(run, 6 * 60 * 60 * 1000); // 10800000
}());
