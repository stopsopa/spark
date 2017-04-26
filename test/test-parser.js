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

describe('parser', () => {

    it('test', function () {

        this.timeout(4000);

        return json('/test/links.html').then((res) => {
            assert(res.json.html.indexOf('start link') > 0)
        });
    })
});