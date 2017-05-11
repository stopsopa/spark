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

        return json('/test/ajax.html' + query, opt)
            .then(function (response) {

                var data = JSON.parse(response.json.html.replace(/^[\s\S]*?<pre id="json">([\s\S]*?)<\/pre>[\s\S]*$/g, '$1'));

                data = data.map((d) => trim(d.m + ' ' + d.u)).join("\n");

                var other = JSON.parse(response.json.html.replace(/^[\s\S]*?<pre id="other">([\s\S]*?)<\/pre>[\s\S]*$/g, '$1'))

                return {
                    files,
                    data : trim(data).split("\n"),
                    other: other,
                    watch: response.json.watchdog
                };
            });
    }

    it('test - 000-dry', function () {

        this.timeout(8000);

        this.slow(4000);

        config.onlyfasttests && this.skip();

        return decode(["000-dry/one", "000-dry/two"]).then((d) => {

            assert.deepEqual(d.data, [
                "n /delay?timeout=10&amp;1",
                "f /delay?timeout=10&amp;2",
                "d 250",
                "j /delay?timeout=10&amp;3",
                "n /delay?timeout=10&amp;4",
                "f /delay?timeout=10&amp;5",
                "j /delay?timeout=10&amp;6"
            ]);

            assert.equal(d.data.length, 7);

            assert(d.other.diff > 800);
        });
    });

    it('test - 001-simple', function () {

        this.timeout(8000);

        this.slow(4000);

        config.onlyfasttests && this.skip();

        return decode('001-simple').then((d) => {

            var file = d.files['001-simple'];

            assert.deepEqual(d.data, file);

            assert(d.other.diff > 1200);

            assert.equal(d.data.length, file.length);

            assert.deepEqual({
                counter: 0,
                flow: "correct",
                notFinishedAsynchronousRequests: [],
                finishedOnTimeAsynchronousRequestsButWithNon200StatusCode: []
            }, d.watch);
        });
    });

    return;

    it('test - status code 500', function () {

        this.timeout(9000);

        this.slow(4000);

        return decode(["002-status-code-500/first", "002-status-code-500/500"], {
            // "ajaxwatchdog": {
            //     "waitafterlastajaxresponse":1000,
            //     "longestajaxrequest":2000
            // }
        }).then((d) => {

            log.dump(d);

        });
    });
});