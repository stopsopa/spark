'use strict';

const assert        = require('assert');
const path          = require('path');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire'))(__dirname, '..');

const config        = rootrequire('test', 'config');
const log           = rootrequire('lib', 'log');
const json          = rootrequire('test', 'lib', 'json');

// http://xxx.xxx.xxx.xxx:1025/test/links.html#empty-href
describe('parser - events log', () => {

    // http://x.x.x.x:1026/test/ajax.html?tape=002-status-code-500/first&tape=002-status-code-500/500
    it('002-dry', function () {

        this.timeout(8000);

        this.slow(4000);

        // config.onlyfasttests && this.skip();
        return json('/delay?Location=%2Fdelay%3FLocation%3D%2Fdelay%26code%3D301&code=301').then((response) => {

            delete response.json.data.headers.date;

            assert.deepEqual(response.json, {
                "error": "prerequest",
                "code": "wrong-status-code",
                "data": {
                    "status": 301,
                    "headers": {
                        "x-powered-by": "Express",
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
});