config = {
    db: {
        connectionLimit : 3, // https://github.com/mysqljs/mysql#pooling-connections
        host     : 'localhost',
        user     : 'root',
        password : '6yhn',
        database : 'spark'
    },
    curl: {
        host: '138.68.156.126',
        port: 80,
        path: '/fetch',
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