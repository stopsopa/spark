config = {
    db: {
        connectionLimit : 3, // https://github.com/mysqljs/mysql#pooling-connections
        host     : 'localhost',
        user     : 'root',
        password : '6yhn',
        database : 'spark',
        connectTimeout: 3000
    },
    curl: {
        url: 'http://138.68.156.126/fetch',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache'
        }
    },
    crawler: {
        waitBeforeCrawlNextPage: 300, // ms
        continueIdleAfter: 5000, // ms
        acceptMime: [

        ],
        acceptExtensions: [
            '', // no extension
            '.html',
            '.htm'
        ]
    }
}

module.exports = config;