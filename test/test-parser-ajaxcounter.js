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

    function decode(tape, opt) {

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

        var file = path.resolve(__dirname, '..', 'static', 'test', 'ajax', tape + '.txt');

        file = trim(fs.readFileSync(file).toString()).split("\n").map(trim);

        return json('/test/ajax.html?tape=' + tape, opt)
            .then(function (response) {

                var data = JSON.parse(response.json.html.replace(/^[\s\S]*?<pre>([\s\S]*?)<\/pre>[\s\S]*$/g, '$1'))
                    .map((d) => trim(d.m + ' ' + d.u)).join("\n")
                ;

                return {
                    file,
                    data : trim(data).split("\n"),
                    wath: response.json.watchdog
                };
            });
    }

    it('test - alltypes - success', function () {

        this.timeout(5000);

        this.slow(4000);

        return decode('alltypes-success').then((d) => {

            assert.deepEqual(d.data, d.file);

            assert.deepEqual({
                counter: 0,
                flow: "correct",
                notFinishedAsynchronousResponses: []
            }, d.wath);

        });
    });

    it('test - jq5sec', function () {

        this.timeout(9000);

        this.slow(4000);

        return decode('jq5sec', {
            "ajaxwatchdog": {
                "waitafterlastajaxresponse":1000,
                "longestajaxrequest":2000
            }
        }).then((d) => {

            assert.deepEqual(d.data, [
                "n /delay",
                "n /delay",
                "j /delay?timeout=5000"
            ]);

            assert.deepEqual(d.wath, {
                "counter": 1,
                "flow": "incomplete",
                "notFinishedAsynchronousResponses": [
                    [
                        "xhr",
                        "GET",
                        "/delay?timeout=5000&ajaxJ",
                        true,
                        null,
                        null
                    ]
                ]
            });

        });
    });
});