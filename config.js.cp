config = {
    site1: {
        source: 'http://www.domain1.com/',
        db: {
            use: 'mysql',
            mysql: {
                connectionLimit : 3, // https://github.com/mysqljs/mysql#pooling-connections
                host            : 'xxx.xxx.xxx.xxx',
                user            : 'root',
                password        : 'password',
                database        : 'cms',
                connectTimeout  : 3000,
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
    site2: {
        source: 'http://www.domain2.com/',
        db: {
            use: 'mysql',
            mysql: {
                connectionLimit : 3, // https://github.com/mysqljs/mysql#pooling-connections
                host            : 'xxx.xxx.xxx.xxx',
                user            : 'root',
                password        : 'password',
                database        : 'cms',
                connectTimeout  : 3000,
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


}

module.exports = config;
