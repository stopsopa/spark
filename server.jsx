// https://nodejs.org/dist/latest-v6.x/docs/api/synopsis.html

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

// var browser = Nightmare({
//     show: true,
//     ignoreCertificateErrors: true
//     //waitTimeout: (60 * 60 * 24 * 7) * 1000 // one week
// })
//     .goto('http://yahoo.com')
//     .type('input[title="Search"]', 'github nightmare')
//     .click('.searchsubmit');

// return log('test');

assert(process.argv.length > 3, "try to call for example 'node " + path.basename(__filename) + " 0.0.0.0 80'");

const ip = process.argv[2];

// http://www.w3resource.com/javascript/form/ip-address-validation.php
assert(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip),
    "first argument should have format of ip address eg: 127.168.10.105 and is '" + ip + "'"
);

const port = process.argv[3];

assert(port >= 0 && port <= 65535, "port beyond range 0 - 65535 : '" + port + "'");

app.use(bodyParser.urlencoded({ extended: false })) // post
app.use(bodyParser.json()); // https://github.com/expressjs/body-parser#expressconnect-top-level-generic

// https://expressjs.com/en/guide/routing.html#app-route
app.all('/fetch', (req, res) => {

    var params = req.query;

    var error = false;

    if (req.method === 'POST') { // http://expressjs.com/en/api.html#req

        // interesting failure, req.body is not object when urlencoded post ???
        // log('post: ', req.body, req.method, isObject(req.body), typeof req.body, req.body.constructor);

        Object.assign(params, req.body);
    }

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

    Nightmare()
        .goto(params.url)
        // .type('input[title="Search"]', 'github nightmare')
        // .click('.searchsubmit');
        .screenshot(params.file)
        .end() // without that, then will be executed but entire script wont stop
        .then(function (result) {

            if (!fs.existsSync(params.file)) {
                throw "file '"+params.file+"' doesn't exist, this file should be created by nightmare";
            }

            if (fs.lstatSync(params.file).isFile()) {

                res.statusCode = 200;

                res.setHeader('Content-Type', 'application/json; charset=utf-8');

                res.end('result: nightmare works (file '+ params.file + ' exist)');
                // log('result: nightmare works (file '+ params.file + ' exist)')
            }
            else {
                throw 'error - file '+ params.file + "hasn't been created";
            }
        })
        .catch(function (error) {
            console.error('Nightmare error:', error);
        })

    // const nightmare = Nightmare({
    //     show: true,
    //     ignoreCertificateErrors: true
    //     //waitTimeout: (60 * 60 * 24 * 7) * 1000 // one week
    // });
    //
    //
    //
    // nightmare
    //     .goto(req.query.url)
    //     // .viewport(win.width, win.height)
    //     .wait('body')
    // ;
    //
    // console.log( ((new Date()).getTime()) + ': ' + JSON.stringify(data))


    // res.statusCode = 200;
    //
    // res.setHeader('Content-Type', 'application/json; charset=utf-8');
    //
    // // https://expressjs.com/en/guide/routing.html#response-methods
    // res.end(JSON.stringify(params, null, 2));
});

app.use(express.static('static'))

app.listen(port, function () {
    console.log('Server running 0.0.0.0:'+port)
});
