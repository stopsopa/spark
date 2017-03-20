const config = {
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
    },
    test: {
        parser      : {
            host: '0.0.0.0',
            port: '91'
        },
        testendpoints : {
            host: '0.0.0.0',
            port: '92'
        },
    }
}

module.exports = config;

if (process.argv.length > 2) {

    let k, tmp = config, ref = process.argv[2], args = ref.split('.');

    do {
        k = args.shift();

        if (tmp[k]) {
            tmp = tmp[k];
        }
        else {
            throw "Can't find data in config under key '" + ref + "'";
        }
    } while (args.length);

    console.log(tmp);
}
