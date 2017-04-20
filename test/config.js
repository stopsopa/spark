'use strict';

const path = require('path');
require(path.resolve(__dirname, '..', 'lib', 'rootrequire.js'))(__dirname, '..');

module.exports = Object.assign(rootrequire('config.js'), {
    db: {
        mysql: {
            connectionLimit : 3, // https://github.com/mysqljs/mysql#pooling-connections
            host            : '127.0.0.1',
            user            : 'root',
            password        : '6yhn', // for travis no password https://docs.travis-ci.com/user/database-setup/#MySQL
            connectTimeout  : 2000,
            database        : 'spark', // CREATE DATABASE `spark` /*!40100 COLLATE 'utf8_general_ci' */;
            table           : 'spark_cache',
            idColumn        : 'id'
        }
    },
    // parser: {
    //     url: 'http://localhost/fetch',
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json; charset=utf-8',
    //         'Cache-Control': 'no-cache'
    //     }
    // },
    // crawler: {
    //     waitBeforeCrawlNextPage: 300, // ms
    //     continueIdleAfter: 5000 // ms
    // },
    parser      : { // https://nodejs.org/api/http.html#http_http_request_options_callback
        hostname    : '0.0.0.0',
        port        : 1025,
        protocol    : 'http:',
        path        : '/fetch'
        // change also user agent for first reuqest curl
        // change also user agent for first reuqest curl
        // change also user agent for first reuqest curl
    },
    testendpoints : { // https://nodejs.org/api/http.html#http_http_request_options_callback
        hostname    : '0.0.0.0',
        port        : 1026,
        protocol    : 'http:',
        path        : '/crawler/index.html'
    },
});