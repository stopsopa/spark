'use strict';

const assert        = require('assert');
const path          = require('path');
const fs            = require('fs');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire'))(__dirname, '..');

const config        = rootrequire('test', 'config');
const log           = rootrequire('lib', 'log');
const json          = rootrequire('test', 'lib', 'json');

function trim(s) {
    return s.replace(/^\s*(\S*(\s+\S+)*)\s*$/,'$1');
}
var entities = (function () {
    var d = {
        '&': /&amp;/g,
        "'": /&apos;/g,
        '"': /&quot;/g,
        '>': /&gt;/g,
        '<': /&lt;/g
    };

    return function (str) {

        for (var i in d) {
            str = str.replace(d[i], i);
        }

        return str;
    }
}());

// http://xxx.xxx.xxx.xxx:1025/test/links.html#empty-href
describe('parser - onAllFinished event', () => {

    function decode(tapes, opt) {

        if (typeof tapes === 'string') {
            tapes = [tapes];
        }

        var query = tapes.map(function (t) {
            return 'tape=' + encodeURIComponent(t);
        }).join('&');

        if (query) {
            query = '?' + query;
        }

        /*
         var def = {
             // "url": url,
             "returnonlyhtml": false,
             "ajaxwatchdog": {
                 "waitafterlastajaxresponse":1000,
                 "longestajaxrequest":5000
             }
         }
         */

        var files = {};

        tapes.forEach(function (tape) {
            var file = path.resolve(__dirname, '..', 'static', 'test', 'ajax', tape + '.txt');
            files[tape] = trim(fs.readFileSync(file).toString()).split("\n").map(trim);
        });

        Object.keys(files).forEach(function (i) {
            files[i].sort();
        });

        return json('/test/ajax.html' + query, opt)
            .then(function (response) {

                var data = JSON.parse(response.json.html.replace(/^[\s\S]*?<pre id="json">([\s\S]*?)<\/pre>[\s\S]*$/g, '$1'));

                var other = JSON.parse(response.json.html.replace(/^[\s\S]*?<pre id="other">([\s\S]*?)<\/pre>[\s\S]*$/g, '$1'))

                var all = Array.prototype.concat.apply([], Object.values(files));

                all.sort();

                data = data.map((d) => trim(d.m + ' ' + d.u)).map(entities).join("\n");

                data = data.trim(data).split("\n");

                data.sort();

                return {
                    files   : files,
                    all     : all,
                    data    : data,
                    other   : other,
                    watch   : response.json.watchdog,
                    json    : response.json
                };
            });
    }

    it('test - 000-encoded', function () {

        this.timeout(8000);

        this.slow(2500);

        config.onlyfasttests && this.skip();

        return decode("000-encoded").then((d) => {
            assert(d.json.html.indexOf('b&amp;c') > -1);
        });
    });

    it('test - 002-dry', function () {

        this.timeout(8000);

        this.slow(4000);

        config.onlyfasttests && this.skip();

        return decode(["002-dry/one", "002-dry/two"]).then((d) => {

            assert.deepEqual(d.data, d.all);

            assert.equal(d.data.length, d.all.length);

            assert(d.other.diff > 800);
        });
    });

    it('test - 001-simple', function () {

        this.timeout(8000);

        this.slow(4000);

        config.onlyfasttests && this.skip();

        return decode('001-simple').then((d) => {

            assert.deepEqual(d.data, d.all);

            assert.equal(d.data.length, d.all.length);

            assert(d.other.diff > 1200);

            assert.deepEqual({
                counter: 0,
                flow: "correct",
                notFinishedAsynchronousRequests: [],
                finishedOnTimeAsynchronousRequestsButWithNon200StatusCode: []
            }, d.watch);
        });
    });

    // http://x.x.x.x:1026/test/ajax.html?tape=002-status-code-500/first&tape=002-status-code-500/500
    it('test - status code 500', function () {

        this.timeout(9000);

        this.slow(4000);

        this.skip();

        // config.onlyfasttests && this.skip();

        return decode(["002-status-code-500/first", "002-status-code-500/500"]).then((d) => {

            log.dump(d.data);
            log.dump(d.all);
            assert.deepEqual(d.data, d.all);

            assert.equal(d.data.length, d.all.length);

            assert(d.other.diff > 2000);

            assert.deepEqual(d.watch, {
                counter: 0,
                flow: "correct",
                notFinishedAsynchronousRequests: [],
                finishedOnTimeAsynchronousRequestsButWithNon200StatusCode: []
            });

        });
    });
});