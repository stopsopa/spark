'use strict';

const assert        = require('assert');
const path          = require('path');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire'))(__dirname, '..');

const config        = rootrequire('test', 'config');
const log           = rootrequire('lib', 'log');
const json          = rootrequire('test', 'lib', 'json');

// http://xxx.xxx.xxx.xxx:1025/test/links.html#empty-href
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

    it('all', function () {
        config.onlyfasttests && this.skip();
        this.timeout(4000);
        this.slow(2500);
        return json('/test/links.html').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(), res.json.internalLinks.links);
        });
    });

    it('hash', function () {
        config.onlyfasttests && this.skip();
        this.timeout(4000);
        this.slow(2500);
        return json('/test/links.html#hash').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(0, 1), res.json.internalLinks.links);
        });
    });

    it('slash', function () {
        config.onlyfasttests && this.skip();
        this.timeout(4000);
        this.slow(2500);
        return json('/test/links.html#slash').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(0, 9), res.json.internalLinks.links);
        });
    });

    it('empty-href', function () {
        config.onlyfasttests && this.skip();
        this.timeout(4000);
        this.slow(2500);
        return json('/test/links.html#empty-href').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(1, 9), res.json.internalLinks.links);
        });
    });

    it('two-slashes-same-port', function () {
        config.onlyfasttests && this.skip();
        this.timeout(4000);
        this.slow(2500);
        return json('/test/links.html#two-slashes-same-port').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(1, 9), res.json.internalLinks.links);
        });
    });

    it('main-domain-with-slash-same-port', function () {
        config.onlyfasttests && this.skip();
        this.timeout(4000);
        this.slow(2500);
        return json('/test/links.html#main-domain-with-slash-same-port').then((res) => {
            assert(res.json.html.indexOf('slash at the beginning') > 0);
            assert.deepEqual(del(0, 9), res.json.internalLinks.links);
        });
    });
});