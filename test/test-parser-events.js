'use strict';

const assert        = require('assert');
const path          = require('path');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire'))(__dirname, '..');

const config        = rootrequire('test', 'config');
const log           = rootrequire('lib', 'log');
const json          = rootrequire('test', 'lib', 'json');

// http://xxx.xxx.xxx.xxx:1025/test/links.html#empty-href
describe('parser - events log', () => {

    it('redirect', function () {

        this.timeout(8000);

        this.slow(3000);

        config.onlyfasttests && this.skip();

        return json('/delay?Location=%2Fdelay%3FLocation%3D%2Fdelay%26code%3D301&code=301').then((response) => {

            delete response.json.data.headers.date;

            assert.deepEqual(response.json, {
                "error": "prerequest",
                "code": "wrong-status-code",
                "data": {
                    "status": 301,
                    "headers": {
                        "x-powered-by": "Express",
                        // "date": "Sun, 21 May 2017 21:55:28 GMT",
                        "content-type": "application/json; charset=utf-8",
                        "location": "/delay?Location=/delay&code=301",
                        "connection": "close",
                        "content-length": "151"
                    }
                },
                "statusCode": 500
            });
        });
    });

    it('no html mime', function () {

        this.timeout(8000);

        this.slow(2000);

        config.onlyfasttests && this.skip();

        return json('/test/json.json').then((response) => {

            delete response.json.data.headers.date;
            delete response.json.data.headers.etag;
            delete response.json.data.headers["last-modified"];

            assert.deepEqual(response.json, {
                "error": "prerequest",
                "code": "wrong-mime-type",
                "data": {
                    "status": 200,
                    "headers": {
                        "x-powered-by": "Express",
                        "accept-ranges": "bytes",
                        "cache-control": "public, max-age=0",
                        // "last-modified": "Mon, 20 Mar 2017 22:45:26 GMT",
                        // "etag": "W/\"b-15aede58460\"",
                        "content-type": "application/json",
                        "content-length": "11",
                        "connection": "close"
                    }
                },
                "statusCode": 500
            });
        });
    });

    it('javascript exception', function () {

        this.timeout(8000);

        this.slow(2000);

        config.onlyfasttests && this.skip();

        return json('/test/jsexception.html').then((response) => {

            assert(response.json.html.indexOf('{"message":"do something before"}') > -1);

            assert.deepEqual(response.json.events.console.exception, [
                [
                    "error",
                    "Uncaught exception on the page",
                    null
                ],
                [
                    "error",
                    "Uncaught exc from ext file",
                    null
                ]
            ]);
        });
    });

    it('javascript console.error', function () {

        this.timeout(8000);

        this.slow(2000);

        config.onlyfasttests && this.skip();

        return json('/test/console.error.html').then((response) => {

            assert(response.json.html.indexOf('{"message":"do something before"}') > -1);

            var error = response.json.events.console.error;

            error[0].shift();
            error[1].shift();

            assert.deepEqual(error, [
                [
                    "console error message"
                ],
                [
                    "c.e from ext file"
                ]
            ]);

            assert.deepEqual(response.json.events.console.exception, [
                [
                    "error",
                    "Uncaught and exception",
                    null
                ]
            ]);
        });
    });

    it('javascript console.log', function () {

        this.timeout(8000);

        this.slow(2000);

        config.onlyfasttests && this.skip();

        return json('/test/console.log.html').then((response) => {

            assert(response.json.html.indexOf('{"message":"do something before"}') > -1);

            var tmp = response.json.events.console.log.filter(function (r) {
                return r[1].indexOf('console log message') > -1 || r[1].indexOf('c.l from ext file') > -1
            });

            tmp[0].shift();
            tmp[1].shift();

            assert.deepEqual(tmp, [
                [
                    "console log message"
                ],
                [
                    "c.l from ext file"
                ]
            ]);
        });
    });

    it('javascript alert', function () {

        this.timeout(8000);

        this.slow(2000);

        config.onlyfasttests && this.skip();

        return json('/test/alert.html').then((response) => {

            assert(response.json.html.indexOf('{"message":"do something before"}') > -1);

            var tmp = response.json.events.console.alert;

            tmp[0].shift();
            tmp[1].shift();

            assert.deepEqual(tmp, [
                [
                    "alert message"
                ],
                [
                    "alert from ext file"
                ]
            ]);
        });
    });
});