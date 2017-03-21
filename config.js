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
    parser: {
        url: 'http://localhost/fetch',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache'
        }
    },
    crawler: {
        waitBeforeCrawlNextPage: 300, // ms
        continueIdleAfter: 5000 // ms
    }
};