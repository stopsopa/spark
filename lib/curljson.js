'use strict';

//Lets require/import the HTTP module
const http          = require('http');
const path          = require('path');
const Nightmare     = require('nightmare');
const url           = require('url');
const log           = console.log;
const config        = require(path.resolve(__dirname, '..', 'config.js'))[process.argv[2]];

function curljson(data, headers) {

    (typeof data !== 'string') && (data = JSON.stringify(data) || '');

    return new Promise(function (resolve, reject) {

        var uri = url.parse(config.parser.url);

        var options = Object.assign({}, config.parser, {
            host    : uri.hostname,
            port    : uri.port,
            path    : uri.path
        });

        var req = http.request(options, function(res) {

            res.setEncoding('utf8');

            var buff = '';

            res.on('data', function (chunk) {
                buff += chunk;
            });

            res.on('end', function () {

                // return resolve(data)
                try {
                    res.json = JSON.parse(buff)
                }
                catch (e) {
                }

                // res.statusCode
                // res.headers

                resolve(res);
            });

        });

        req.on('error', function(e) {
            reject(e)
        });

        data && req.write(data);

        req.end();
    });
}

curljson.spark = function (url) {
    return curljson({
        "url": url,
        "returnonlyhtml": false,
        "ajaxwatchdog": {
            "waitafterlastajaxresponse":1000,
            "longestajaxrequest":5000
        }
    });
}

module.exports = curljson;