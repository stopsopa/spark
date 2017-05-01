'use strict';

const assert        = require('assert');
const path          = require('path');
const glob          = require("glob");
const fs            = require('fs');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire.js'))(__dirname, '..');

const overridetests = rootrequire('lib', 'overridetests.js');
const config        = rootrequire('test', 'config.js');
const log           = rootrequire('lib', 'log.js');
const delay         = rootrequire('test', 'delay.js');
const curljson      = rootrequire('lib', 'curljson.js')(config.parser);

var json = (function () {

    var def = {
        // "url": url,
        "returnonlyhtml": false,
        "ajaxwatchdog": {
            "waitafterlastajaxresponse":1000,
            "longestajaxrequest":5000
        }
    }

    return function (opt) {

        if (typeof opt === 'string') {
            opt = {
                url: opt
            };
        }

        var e = config.testendpoints;

        if (!/^https?:\/\/.+$/.test(opt.url)) {
            opt.url = e.protocol + '//' + e.hostname + ((e.port && (e.port != 80)) ? (':' + e.port) : '') + opt.url;
        }

        return curljson(Object.assign({}, def, opt));
    }
}());

describe('parser - links', () => {

    var del = (function () {
        var tmp = [
            "",
            "/",
            "/link#hash",
            "/link/slash at the beginning",
            "/test/../../up2.html",
            "/test/../up.html",
            "/test/links.html",
            "/test/links.html#hash",
            "/test/links.html#hash2",
            "/test/links.html#id hash",
            "/test/links.html?onlyparameter",
            "/test/links.html?onlyparameter#andhash",
            "/test/links.html?param=val1",
            "/test/links.html?param=val1#hash1",
            "/test/links.html?param=val2",
            "/test/links.html?param=val2#hash2",
            "/test/no slash at the beginning",
            "/test/same-origin-same-port.html"
        ];
        return function () {

            var cp = tmp.concat([]);

            Array.prototype.slice.call(arguments, 0).forEach(function (i) {
                if (typeof i === 'number' && i > -1) {
                    delete cp[i];
                }
            });

            return cp.filter(function (a) {
                return typeof a !== 'undefined';
            });
        }
    }());

    it('test - all', function () {
        this.timeout(4000);
        return json('/test/links.html').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(), res.json.internalLinks.links);
        });
    });

    it('test - hash', function () {
        this.timeout(4000);
        return json('/test/links.html#hash').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(0, 1), res.json.internalLinks.links);
        });
    });

    it('test - slash', function () {
        this.timeout(4000);
        return json('/test/links.html#slash').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(0, 9), res.json.internalLinks.links);
        });
    });

    it('test - empty-href', function () {
        this.timeout(4000);
        return json('/test/links.html#empty-href').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(1, 9), res.json.internalLinks.links);
        });
    });

    it('test - two-slashes-same-port', function () {
        this.timeout(4000);
        return json('/test/links.html#two-slashes-same-port').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(1, 9), res.json.internalLinks.links);
        });
    });

    it('test - main-domain-with-slashq-same-port', function () {
        this.timeout(4000);
        return json('/test/links.html#main-domain-with-slashq-same-port').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(0, 9), res.json.internalLinks.links);
        });
    });
});