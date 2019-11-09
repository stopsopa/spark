

const URL           = require('url').URL;

const https         = require('https');

const http          = require('http');

const querystring   = require('querystring');

const log           = require('inspc');

const th            = msg => new Error(`request: ${String(msg)}`);

function request (url, opt = {}) {

    let {
        method      = 'GET',
        timeout     = 30000,
        get         = {},
    } = opt;

    if ( typeof method !== 'string' ) {

        throw th(`method is not a string`);
    }

    method = method.toLowerCase();

    return new Promise((resolve, reject) => {

        const uri   = new URL(url);

        const lib   = (uri.protocol === 'https:') ? https : http;

        const query = querystring.stringify(get)

        const rq = {
            hostname    : uri.hostname,
            port        : uri.port || ( (uri.protocol === 'https:') ? '443' : '80'),
            path        : uri.pathname + uri.search + (query ? (uri.search.includes('?') ? '&' : '?') + query : ''),
            method,
            headers     : {
                'Content-Type': 'application/json; charset=utf-8',
                Accept: `text/html; charset=utf-8`,
            },
        };

        var req = lib.request(rq, res => {

            const isHtml = (res.headers['content-type'] || '').toLowerCase().indexOf('text/html') === 0;

            if (isHtml) {

                res.setEncoding('utf8');

                let body = '';

                res.on('data', chunk => {

                    body += chunk
                });

                res.on('end', () => {

                    // log.dump({
                    //     status: res.statusCode,
                    //     headers: res.headers,
                    //     isHtml,
                    //     uri,
                    //     body,
                    //     rq,
                    // }, 5)

                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body,
                    })
                });
            }
            else {

                // log.dump({
                //     status: res.statusCode,
                //     headers: res.headers,
                //     isHtml,
                //     uri,
                //     rq,
                // }, 5)

                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                })
            }
        });

        req.on('error', e => { // wothout this it will crash the main node server

            log.dump({
                request: rq,
                ping_error: e,
            })
        });

        req.on('socket', function (socket) { // uncomment this to have timeout

            socket.setTimeout(timeout);

            socket.on('timeout', () => { // https://stackoverflow.com/a/9910413/5560682

                req.abort();

                reject({
                    type: 'timeout',
                })
            });
        });

        req.on('error', e => reject({
            type: 'error',
            error: e,
        }));

        if ( typeof opt.json !== 'undefined' ) {

            if (opt.method === 'get') {

                throw th(`opt.json is given but method is still get`);
            }

            log.dump({
                sendjson: opt.json,
            }, 5)

            req.write(JSON.stringify(opt.json));
        }

        req.end();
    });
}

const url = process.argv[2];

if ( typeof url !== 'string' ) {

    throw th(`url param is not a string`);
}

if ( ! /^https?:\/\//.test(url) ) {

    throw th(`url don't match https?:\/\/`);
}

;(async function () {

    try {

        const data = await request(url, {
            timeout: 3000,
        });

        // log.dump({
        //     data,
        // }, 3)

        process.exit(data.status);
    }
    catch (e) {

        log.dump({
            error: e
        })

        process.exit(504);
    }
}());