'use strict';

const path              = require('path');
const mysql             = require('mysql');
const sha1              = require('sha1');

require(path.resolve(__dirname, '..', '..', 'rootrequire.js'))(__dirname, '..', '..', '..');

const hash              = rootrequire('lib', 'hash.js');
const log               = rootrequire('lib', 'log.js');
const abstract          = require(path.resolve(__dirname, 'db_abstract.js'));
const searchforerrors   = rootrequire('lib', 'db', 'searchforerrors.js');

// const config    = require(path.resolve(__dirname, '..', 'config.js'));
//
// const pool      = mysql.createPool(config.db.mysql);

/**
 * db_spark.js
 */
module.exports = function (config, general) {

    const pool      = mysql.createPool(config);

    function extend(table, id, more) {
        function cache() {
            abstract.apply(this, arguments);
        }
        cache.prototype = Object.create(abstract.prototype);
        cache.prototype.constructor = cache;

        Object.assign(cache.prototype, more);

        return new cache(table, id, pool);
    }

    pool
        .on('connection', function (connection) {
            connection.query('SET NAMES utf8');
        })
    ;

    var tables = {
        pool: pool,
        cache: extend('spark_cache', 'id', {
            /**
             * fetch next url to process
             */
            fetch: function () {
                return this.fetchOne("select * from :table: WHERE updateRequest is not null ORDER BY updateRequest DESC LIMIT 1");
            },
            /**
             * Insert new url to db
             * @param url
             * @param data
             */
            create: function (url) {

                var id              = hash(url);

                var date            = tables.date();

                date.setSeconds(date.getSeconds() + (general.crawler.lastTimeFoundCorrection || -5000));

                var now             = tables.now();

                var updateRequest   = tables.now(date);

                return this.insert({
                    id              : id,
                    url             : url,
                    created         : now,
                    lastTimeFound   : now,
                    updateRequest   : updateRequest
                }).then(function (res) {
                    res.id = id;
                    return res;
                });
            },
            /**
             * 200 code
             * Write data to db after successful prerendering page
             * link must already exists in db
             */
            success: function (hash, json, html) {
                return this.update({
                    updated         : tables.now(),
                    html            : html || '',
                    updateRequest   : null,
                    statusCode      : 200,
                    json            : JSON.stringify(json, null, '  ') || '-empty-',
                    warning         : searchforerrors(json),
                    errorCounter    : null
                }, hash)
            },
            /**
             * Link needs to already exists
             */
            error: function (hash, status, json, html) {
                return this.query(`
UPDATE :table: SET  html            = :html,
                    updated         = :updated,
                    statusCode      = :statusCode,
                    updateRequest     = null,
                    json            = :json,
                    warning         = null,
                    errorCounter    = if(errorCounter, errorCounter, 0) + 1
WHERE               id = :id                         
`,              {
                    id              : hash,
                    statusCode      : status,
                    json            : JSON.stringify(json, null, '  ') || '-empty-',
                    html            : html || '',
                    updated         : tables.now()
                })
            }
        }),
        /**
         * return
         *      "2017-03-23T21:13:31.000Z"   - (format Date() object)
         * instead of
         *      "2017-03-23T21:13:31.874Z"   - (format Date() object)
         */
        date: (function (tmp) {
            return function (date) {

                var tmp = date;

                if (!tmp) {
                    tmp = new Date();
                    tmp.setSeconds(0,0);
                }

                return tmp;
            }
        }()),
        /**
         * return "2017-03-23 21:13:31"     - (format string)
         */
        now: (function (tmp) {
            return function (date) {
                tmp = (tables.date(date)).toISOString().substring(0, 19).split('');
                tmp[10] = ' ';
                return tmp.join('');
            }
        }()),
        hash: function (url) {

            if ( ! /^https?:\/\/.+/.test(url) ) {
                throw "Can't generate hash for url: " + url + " must match /^https?:\/\/.+/";
            }

            return sha1(url);
        }
    };

    return tables;
};