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

app.use(express.static(path.resolve(__dirname, '..', 'static')));

app.all('/', (req, res) => {
    res.end(ip + ':' + port + ' is working...');
})

app.all('/delay', (req, res) => {

    var params = {
        timeout: 0
    }

    if (req.query.timeout > 0) {
        params = Object.assign(params, req.query);
    }

    if (req.body.timeout > 0) {
        params = Object.assign(params, req.body);
    }

    params.timeout = parseInt(params.timeout, 10);

    setTimeout(() => {

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        res.end(JSON.stringify({
            ok: true,
            timeout: params.timeout
        }));

    }, params.timeout)
});

app.get('/ajaxwrong', (req, res) => {

});

app.listen(port, ip, () => {
    console.log('Test endpoints server is running ' + ip + ':' + port)
});


