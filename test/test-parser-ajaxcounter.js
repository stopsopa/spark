'use strict';

const assert        = require('assert');
const path          = require('path');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire'))(__dirname, '..');

const config        = rootrequire('test', 'config');
const log           = rootrequire('lib', 'log');
const decode        = rootrequire('test', 'lib', 'decode');

// http://xxx.xxx.xxx.xxx:1025/test/links.html#empty-href
describe('parser - onAllFinished event', () => {

    // check if in html from document.documentElement.outerHTML encode all content in dom elements, like pre with json
    it('000-encoded', function () {

        this.timeout(8000);

        this.slow(2500);

        config.onlyfasttests && this.skip();

        return decode(["000-encoded"]).then((d) => {

            assert.equal(d.json.contentType, "text/html; charset=UTF-8");

            assert.equal(d.json.statusCode, 200);

            assert(d.json.html.indexOf('b&amp;c') > -1);
        });
    });

    //
    it('002-dry', function () {

        this.timeout(8000);

        this.slow(4000);

        config.onlyfasttests && this.skip();

        return decode(["002-dry/one", "002-dry/two"]).then((d) => {

            assert.equal(d.json.contentType, "text/html; charset=UTF-8");

            assert.equal(d.json.statusCode, 200);

            assert.deepEqual(d.data, d.all);

            assert.equal(d.data.length, d.all.length);

            assert(d.other.diff > 1200, [d.other.diff, '!>', 1500]);

            assert.deepEqual(d.watchdog, {
                flow: "correct",
                notFinishedAsynchronousRequests: [],
                finishedOnTimeAsynchronousRequestsButWithNon200StatusCode: []
            });
        });
    });

    it('001-simple', function () {

        this.timeout(8000);

        this.slow(4000);

        config.onlyfasttests && this.skip();

        return decode(['001-simple']).then((d) => {

            assert.equal(d.json.contentType, "text/html; charset=UTF-8");

            assert.equal(d.json.statusCode, 200);

            assert.deepEqual(d.data, d.all);

            assert.equal(d.data.length, d.all.length);

            assert(d.other.diff > 1200);

            assert.deepEqual(d.watchdog, {
                flow: "correct",
                notFinishedAsynchronousRequests: [],
                finishedOnTimeAsynchronousRequestsButWithNon200StatusCode: []
            });
        });
    });

    // http://x.x.x.x:1026/test/ajax.html?tape=002-status-code-500/first&tape=002-status-code-500/500
    it('status code 500', function () {

        this.timeout(9000);

        this.slow(4000);

        config.onlyfasttests && this.skip();

        return decode(["002-status-code-500/first", "002-status-code-500/500"]).then((d) => {

            assert.equal(d.json.contentType, "text/html; charset=UTF-8");

            assert.equal(d.json.statusCode, 200);

            assert.deepEqual(d.data, d.all);

            assert.equal(d.data.length, d.all.length);

            assert(d.other.diff > 2000);

            assert.deepEqual(d.watchdog, {
                "finishedOnTimeAsynchronousRequestsButWithNon200StatusCode": [
                    {
                        "request": [
                            "xhr",
                            "GET",
                            "/delay?timeout=51&ajaxN",
                            true
                        ],
                        "statusCode": 500
                    },
                    {
                        "request": [
                            "fetch",
                            "GET",
                            "/delay?timeout=102&code=500&ajaxF"
                        ],
                        "statusCode": 500
                    },
                    {
                        "request": [
                            "xhr",
                            "GET",
                            "/delay?timeout=103&code=500&ajaxN",
                            true
                        ],
                        "statusCode": 500
                    }
                ],
                "flow": "correct",
                "notFinishedAsynchronousRequests": []
            });
        });
    });

    // http://x.x.x.x:1026/test/ajax.html?tape=003-timeout/slow&tape=003-timeout/n&tape=003-timeout/j&tape=003-timeout/f
    it('long - is time', function () {

        this.timeout(9000);

        this.slow(5500);

        config.onlyfasttests && this.skip();

        return decode(["003-timeout/fast", "003-timeout/n", "003-timeout/j", "003-timeout/f"], {
            ajaxwatchdog: {
                waitafterlastajaxresponse: 1000,
                longestajaxrequest: 4500
            }
        }).then((d) => {

            assert.equal(d.json.contentType, "text/html; charset=UTF-8");

            assert.equal(d.json.statusCode, 200);

            assert.deepEqual(d.data, d.all);

            assert.equal(d.data.length, d.all.length);

            assert(d.other.diff > 1500);

            assert.deepEqual(d.watchdog, {
                flow: "correct",
                notFinishedAsynchronousRequests: [],
                finishedOnTimeAsynchronousRequestsButWithNon200StatusCode: []
            });
        });
    });

    // http://x.x.x.x:1026/test/ajax.html?tape=003-timeout/fast&tape=003-timeout/n&tape=003-timeout/j&tape=003-timeout/f
    it('long - no time', function () {

        this.timeout(9000);

        this.slow(5000);

        config.onlyfasttests && this.skip();

        return decode(["003-timeout/fast", "003-timeout/n", "003-timeout/j", "003-timeout/f"], {
            ajaxwatchdog: {
                waitafterlastajaxresponse: 500,
                longestajaxrequest: 1500
            }
        }).then((d) => {

            assert.equal(d.json.contentType, "text/html; charset=UTF-8");

            assert.equal(d.json.statusCode, 200);

            assert.deepEqual(d.data, d.all);

            assert.equal(d.data.length, d.all.length);

            assert(d.other.diff > 1500);

            d.watchdog.notFinishedAsynchronousRequests.sort(function (a, b) {

                if (a[2] === b[2]) {
                    return 0;
                }

                return a[2] > b[2];
            });

            assert.deepEqual(d.watchdog, {
                "finishedOnTimeAsynchronousRequestsButWithNon200StatusCode": [],
                "flow": "incomplete",
                "notFinishedAsynchronousRequests": [
                    [
                        "fetch",
                        "GET",
                        "/delay?timeout=3000&ajaxF"
                    ],
                    [
                        "xhr",
                        "GET",
                        "/delay?timeout=3000&ajaxJ",
                        true,
                        null,
                        null
                    ],
                    [
                        "xhr",
                        "GET",
                        "/delay?timeout=3000&ajaxN",
                        true
                    ]
                ]
            });
        });
    });
});