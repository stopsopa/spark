// https://nodejs.org/dist/latest-v6.x/docs/api/synopsis.html

// później obczaić:
// clear cache: https://github.com/segmentio/nightmare#custom-preload-script

const Nightmare     = require('nightmare');
const http          = require('http');
const path          = require('path');
const bodyParser    = require('body-parser');
const fs            = require('fs');
const log           = console.log;
const assert        = console.assert;
const express       = require('express');
const app           = express();

function isObject(a) {
    return (!!a) && (a.constructor === Object);
};

assert(process.argv.length > 3, "try to call for example 'node " + path.basename(__filename) + " 0.0.0.0 80'");

const ip = process.argv[2];

// http://www.w3resource.com/javascript/form/ip-address-validation.php
assert(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip),
    "first argument should have format of ip address eg: 127.168.10.105 and is '" + ip + "'"
);

const port = process.argv[3];

assert(port >= 0 && port <= 65535, "port beyond range 0 - 65535 : '" + port + "'");

app.use(bodyParser.urlencoded({ extended: false })) // post data
app.use(bodyParser.json()); // https://github.com/expressjs/body-parser#expressconnect-top-level-generic

const defopt = {
    // width: 1366,
    // height: 768,
    // nightmare: {
    //     gotoTimeout: 20000, // 20 sec
    //     waitTimeout: 20000, // 20 sec
    //     executionTimeout: 10000, // 10 sec
    // },
    headers : {}
};

const nightmaredef = { // https://github.com/segmentio/nightmare#api
    gotoTimeout: 20000, // 20 sec
    waitTimeout: 20000, // 20 sec
    executionTimeout: 10000, // 10 sec
    loadTimeout: 10000, // 10 sec
    'ignore-certificate-errors': true,
    show: false,
    ignoreCertificateErrors: true
};
// https://expressjs.com/en/guide/routing.html#app-route
app.all('/fetch', (req, res) => {

    var params = req.query;

    var error = false;

    if (req.method === 'POST') { // http://expressjs.com/en/api.html#req

        // interesting failure: req.body is not object when urlencoded post ???
        // log('post: ', req.body, req.method, isObject(req.body), typeof req.body, req.body.constructor);
        Object.assign(params, req.body);
    }

    params = Object.assign({}, defopt, params);

    var nightmareopt = Object.assign({}, nightmaredef);

    if (params.nightmare) {
        nightmareopt = Object.assign(nightmareopt, param.nightmare)
    }

    log('params', params);

    if (!params.url) {

        error = "specify 'url' param (in get or post or json method)";
    }

    if (!params.file) {

        error = "specify 'file' param (in get or post or json method)";
    }

    if (error) {

        res.statusCode = 404;

        return res.end(error);
    }

    var night = Nightmare(nightmareopt);

    var once = function (fn) {
        var trigger = true;
        return function () {
            if (trigger) {
                trigger = false;
                return fn.apply(this, Array.prototype.slice.call(arguments));
            }
        };
    };

    var collect = {};

    night
        .on('did-get-response-details', once(function () {
            // https://github.com/segmentio/nightmare#onevent-callback
            // https://github.com/electron/electron/blob/master/docs/api/web-contents.md#class-webcontents
            // log('did-get-response-details', Array.prototype.slice.call(arguments)[7])
            var data = Array.prototype.slice.call(arguments);
            data.push({
                doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-get-response-details'
            });
            collect['did-get-response-details'] = data;
        }))
        .on('did-fail-load', once(function () {
            var data = Array.prototype.slice.call(arguments);
            data.push({
                doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-fail-load'
            });
            collect['did-fail-load'] = data;
        }))
        .on('did-get-redirect-request', function () {
            if (!collect['did-get-redirect-request']) {
                collect['did-get-redirect-request'] = [];
            }
            var data = Array.prototype.slice.call(arguments);
            data.push({
                doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-get-redirect-request'
            });
            collect['did-get-redirect-request'].push(data);
        })
        .goto(params.url, params.headers || {})
        .screenshot(params.file)
        .end() // without that, then will be executed but entire script wont stop
        .then(function () {

            var data = {
                collect: collect
            };

            res.setHeader('Content-Type', 'application/json; charset=utf-8');

            res.statusCode = collect['did-get-response-details'][4];

            res.end(JSON.stringify(data));
        })
        .catch(function (error) {

            res.setHeader('Content-Type', 'application/json; charset=utf-8');

            res.statusCode = 500;

            res.end(JSON.stringify({
                try_catch: 'Nightmare crashed',
                details: error
            }));
        })
});

app.use(express.static('static'))

app.listen(port, function () {
    console.log('Server running 0.0.0.0:'+port)
});
