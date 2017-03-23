'use strict';

const url       = require('url');
const http      = require('http');
const path      = require('path');
const log       = require(path.resolve(__dirname, '..', 'lib', 'log.js'));

function curl(uri, method) {

    uri = url.parse(uri);

    var options = {
        method: method,
        host: uri.hostname,
        port: uri.port,
        path: uri.path
    };

    return new Promise(function (resolve, reject) {

        var req = http.request(options, function(res) {

            res.setEncoding('utf8');

            resolve(res);
        });

        req.on('error', function(e) {
            reject(e)
        });

        req.end();
    });
}

curl('http://www.lymphomahub.com/', 'head')
    .then(function (res) {
        log('status:', res.statusCode)
        log.json(res.headers)
    }, function (e) {
        log.json(e)
    })
    .catch(function (e) {
        log.json(e)
    })