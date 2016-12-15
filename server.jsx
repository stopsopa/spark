// https://nodejs.org/dist/latest-v6.x/docs/api/synopsis.html

const Nightmare = require('nightmare');
const http      = require('http');
const path      = require('path');
const log       = console.log;
const assert    = console.assert;
const express   = require('express');
const app = express();


Nightmare()
    .goto('http://yahoo.com')
    .type('input[title="Search"]', 'github nightmare')
    .click('.searchsubmit');

assert(process.argv.length > 3, "try to call for example 'node " + path.basename(__filename) + " 0.0.0.0 80'");

const ip = process.argv[2];

// http://www.w3resource.com/javascript/form/ip-address-validation.php
assert(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip),
    "first argument should have format of ip address eg: 127.168.10.105 and is '" + ip + "'"
);

const port = process.argv[3];

assert(port >= 0 && port <= 65535, "port beyond range 0 - 65535 : '" + port + "'");

app.get('/fetch', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');

    var data = {};

    console.log()

     // Nightmare()
     //    .goto('http://yahoo.com')
     //    .type('input[title="Search"]', 'github nightmare')
     //    .click('.searchsubmit');

    // const nightmare = Nightmare({
    //     show: true,
    //     ignoreCertificateErrors: true
    //     //waitTimeout: (60 * 60 * 24 * 7) * 1000 // one week
    // });
    //
    //
    // data.url = req.query.url
    //
    // nightmare
    //     .goto(req.query.url)
    //     // .viewport(win.width, win.height)
    //     .wait('body')
    // ;
    //
    console.log( ((new Date()).getTime()) + ': ' + JSON.stringify(data))
    // res.end(JSON.stringify(data));
});

app.listen(port, ip);
