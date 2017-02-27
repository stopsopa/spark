'use strict';

//Lets require/import the HTTP module
const http          = require('http');
const path          = require('path');
const Nightmare     = require('nightmare');
const log           = console.log;
const config        = require(path.resolve(__dirname, '..', 'config.js'));

function curljson(data, headers) {

    return new Promise(function (resolve, reject) {

        var req = http.request(config.curl, function(res) {

            res.setEncoding('utf8');

            var data = '';

            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on('end', function () {

                // return resolve(data)
                res.json = JSON.parse(data)

                // res.statusCode
                // res.headers

                resolve(res);
            });

        });

        req.on('error', function(e) {
            reject(e)
        });

        req.write(JSON.stringify(data));

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