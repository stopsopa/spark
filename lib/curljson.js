'use strict';

const http          = require('http');
const path          = require('path');
const url           = require('url');
// const log           = require('./log');

module.exports = function (config) {

    function curljson(data) {

        if (typeof data !== 'string') {
            data = JSON.stringify(data) || '';
        }

        return new Promise(function (resolve, reject) {

            var req = http.request(config, function(res) {

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
                        res.body = buff;
                    }

                    // res.statusCode
                    // res.headers

                    resolve(res);
                });

            });

            req.on('error', function(e) {
                // e = Object.assign({}, e);
                // e.reason = 'error';
                // log('error', e);
                reject(e)
            });

            req.on('timeout', function (e) {
                // e = Object.assign({}, e);
                // e.reason = 'timeout';
                // log('timeout', e);
                // req.abort();
                reject(e);
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

    return curljson;
}