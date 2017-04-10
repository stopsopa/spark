'use strict';

module.exports = {
    db: {
        use: 'mysql',
        mysql: {
            connectionLimit : 3, // https://github.com/mysqljs/mysql#pooling-connections
            host            : 'localhost',
            user            : 'root',
            password        : '6yhn',
            connectTimeout  : 3000,
            database        : 'spark',
            table           : 'spark_cache'
        }
    },
    parser: { // https://nodejs.org/api/http.html#http_http_request_options_callback
        hostname    : '0.0.0.0',
        // port        : 80, // default 80
        protocol    : 'http:',
        path        : '/fetch',
        method      : 'POST',
        headers     : {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache'
        }
        // change also user agent for first reuqest curl
        // change also user agent for first reuqest curl
        // change also user agent for first reuqest curl
    },
    crawler: {
        waitBeforeCrawlNextPage: 300, // ms
        continueIdleAfter: 5000, // ms
        lastTimeFoundCorrection: -10 // sec
    }
};