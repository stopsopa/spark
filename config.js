'use strict';

module.exports = { 
    lh: {
        db: {
            use: 'mysql',
            mysql: {
                connectionLimit : 3, // https://github.com/mysqljs/mysql#pooling-connections
                host     : 'xx.xx.xx.xx',
                user     : 'root',
                password : 'pass',
                database : 'cms',
                connectTimeout: 3000,
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
    },
    agp: {
        db: {
            use: 'mysql',
            mysql: {
                connectionLimit : 3, // https://github.com/mysqljs/mysql#pooling-connections
                host     : 'xx.xx.xx.xx',
                user     : 'root',
                password : 'pass',
                database : 'agp',
                connectTimeout: 3000,
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
    }
};