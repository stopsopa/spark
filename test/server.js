'use strict';

const path          = require('path');
const http          = require('http');
const bodyParser    = require('body-parser');
const express       = require('express');
const assert        = console.assert;

require(path.resolve(__dirname, '..', 'lib', 'rootrequire'))(__dirname, '..');

const log           = rootrequire('lib', 'log');

const app           = express();

app.use(function(req, res, next) {
    req.headers['if-none-match'] = 'no-match-for-this';
    next();
});

assert(process.argv.length > 3, "try to call for example 'node " + path.basename(__filename) + " 0.0.0.0 80'");

const ip = process.argv[2];

// http://www.w3resource.com/javascript/form/ip-address-validation.php
assert(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip),
    "first argument should have format of ip address eg: 127.168.10.105 and is '" + ip + "'"
);

const port = process.argv[3];

assert(port >= 0 && port <= 65535, "port beyond range 0 - 65535 : '" + port + "'");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json()); // https://github.com/expressjs/body-parser#expressconnect-top-level-generic

app.all('/', (req, res) => {
    res.end(ip + ':' + port + ' is working...');
})

app.all('/delay', (req, res) => {

    var def = {
        timeout: 0,
        code: 200,
        'Content-Type' : 'application/json; charset=utf-8'
    }

    var params = Object.assign({}, def);

    if (Object.keys(req.query || {})) {
        params = Object.assign(params, req.query);
    }

    if (Object.keys(req.body || {})) {
        params = Object.assign(params, req.body);
    }

    var timeout     = parseInt(params.timeout, 10) || def.timeout;
    var code        = parseInt(params.code, 10) || def.code;

    delete params.timeout;
    delete params.code;

    Object.keys(params).forEach(function (h, v) {
        v = params[h];
        v && res.setHeader(h, v);
    });

    res.status(code);

    setTimeout(() => {

        res.end(JSON.stringify(Object.assign(params, {
            ok: true
        }), null, '    '));

    }, timeout);
});

app.get('/ajaxwrong', (req, res) => {

});

app.listen(port, ip, () => {
    console.log('Test endpoints server is running ' + ip + ':' + port)
});

app.use(express.static(path.resolve(__dirname, '..', 'static')));


