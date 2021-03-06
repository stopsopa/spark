// 'use strict';


const path          = require('path');
const http          = require('http');
const sha1          = require('sha1');


require(path.resolve(__dirname, 'lib', 'rootrequire.js'))(__dirname, '.');

let log             = rootrequire('lib', 'log.js');
const spark         = rootrequire('lib', 'curljson.js').spark;
const dbprovider    = rootrequire('lib', 'db', 'mysql', 'db_spark.js');
const config        = rootrequire('config')[process.argv[2]];
const pingdom       = rootrequire('pingdom', 'pingdom');

pingdom.set(process.argv[2]);

const db            = dbprovider(config);

log = (function (old, n) {

    n = function (str) {
        return old(__stack[1].getFileName() + ':' + (String("     " + __stack[1].getLineNumber()).slice(-5)) + ': ' + db.now() + ': ' + process.pid + ": ", str);
    }

    n.line = function (d) {
        return old(__stack[1].getFileName() + ':' + (String("     " + __stack[1].getLineNumber()).slice(-5)) + ': ' + db.now() + ': ' + process.pid + ":\n", d);
    }

    n.json = function (d) {
        return old.json(__stack[1].getFileName() + ':' + (String("     " + __stack[1].getLineNumber()).slice(-5)) + ': ' + db.now() + ': ' + process.pid + ":\n", d);
    }

    return n;
}(log));

log('start crawler: ' + process.argv[2]);

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

    if (emercounter >= 15) {

        log('emergency crawl, couter:' + emercounter);

        emercounter = 0;
        emergency = false;

        inter(config.crawler.continueIdleAfter * 4);
        return;
    }

    // db.cache.fetchOne("SELECT * FROM :table: WHERE updateRequest IS NOT NULL AND block = 0 ORDER BY updateRequest DESC LIMIT 1")
    db.cache.fetchOne("SELECT * FROM :table: s WHERE updateRequest IS NOT NULL AND block = 0 ORDER BY CASE WHEN (s.statusCode = 200) THEN 1 ELSE 0 END, updateRequest DESC LIMIT 1")
        .then(function (row, url) {

            url = row.url;

            url += ((url.indexOf('?') > -1) ? '&' : '?' ) + '_';

            log(`att: ${row.url}`);

            spark(url)
                .then(function (res) {

                    log(`${res.statusCode}: ${row.url}`);

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

                                    // log('inter');
                                    inter(config.crawler.waitBeforeCrawlNextPage);
                                }, function (e) {

                                    log.json(`error '${row.url}': blocked`);
                                    log.json(e)
                                    log.json(upd);

                                    db.cache.update({
                                        block: 1,
                                    }, row.id).then(() => {

                                        inter(config.crawler.waitBeforeCrawlNextPage);
                                    });
                                });
                        });
                    }
                    else {
                        db.cache.query(`
UPDATE :table: SET  updated         = :updated,
                    updateRequest     = null,
                    json            = :json,
                    warning         = null,
                    errorCounter    = if(errorCounter, errorCounter, 0) + 1
WHERE               id = :id                         
`,                      {
                            id          : row.id,
                            // html        : html || '',
                            updated     : db.now(),
                            updateRequest     : null,
                            // statusCode  : res.statusCode,
                            json        : JSON.stringify(res.json, null, '  ') || '-empty-'
                        })
                        .then(function (res) {
                            inter(config.crawler.waitBeforeCrawlNextPage);
                        }, function (e) {
                            log.json('error');
                            log.json(e);
                            log('inter');
                            inter(config.crawler.waitBeforeCrawlNextPage);
                        });
                    }
                }, function (e) {

                    log("      spark can't crawl : " + row.url, JSON.stringify(e));

                    if (!emergency) {
                        emercounter = 0;
                    }

                    emergency = true;
                    inter(config.crawler.continueIdleAfter);

                    // @todo - send email
                });

        }, function (e) {
            if (e.error === 'found 0 rows') {
                // log('inter');
                inter(config.crawler.continueIdleAfter);
            }
            else {
                log.json(e)
            }
        });
}

log('start...');

(function () {
    function run() {

        log('reset updateRequest');

        db.cache.query('update :table: set updateRequest = FROM_UNIXTIME(UNIX_TIMESTAMP() + (100000 - length(url)))').then(function () {
            inter(config.crawler.continueIdleAfter);
        }, function (e) {
            log('updateRequest error');
            log(e)
        });

        pingdom.set(process.argv[2]);
    }
    run();
    setInterval(run, parseInt(60 * 60 * 24) * 1000); // 10800000
}());



// ping endpoint

(/^\d+$/.test(process.argv[3])) ? (function (port) {

    const express       = require('express');

    const app           = express();

    app.all('/ping', (req, res) => {
        res.end(JSON.stringify({
            ok: true,
            // port: port
        }))
    });

    app.listen(port, '0.0.0.0', () => {

        console.log('crawler.js endpoint is up and running: 0.0.0.0:' + port)
    });

}(parseInt(process.argv[3], 10))) : (function () {throw `process.argv[3] is missing`}());