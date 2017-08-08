'use strict';

const path          = require('path');
const fs            = require('fs');

require(path.resolve(__dirname, '..', '..', 'lib', 'rootrequire'))(__dirname, '..', '..');

const json          = rootrequire('test', 'lib', 'json');
const arglib        = rootrequire('lib', 'args');
                      rootrequire('lib', 'polyfills');
const log           = rootrequire('lib', 'log');

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

module.exports = function (/*[path:string], tapes:array, options:object*/) {

    var alib = arglib(arguments);

    var tapes = alib.array.shift([]);

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
        var file = path.resolve(__dirname, '..', '..', 'static', 'test', 'ajax', tape + '.txt');
        files[tape] = trim(fs.readFileSync(file).toString()).split("\n").map(trim);
    });

    Object.keys(files).forEach(function (i) {
        files[i].sort();
    });

    var opt = alib.object.shift({});

    opt = Object.assign(opt || {}, opt || {
        ajaxwatchdog: {
            waitafterlastajaxresponse: 1001,
            longestajaxrequest: 1501
        }
    });

    return json(alib.string.shift('/test/ajax.html') + query, opt)
        .then(function (response) {

            var data = [], other = {};

            try {
                data = JSON.parse(response.json.html.replace(/^[\s\S]*?<pre id="json">([\s\S]*?)<\/pre>[\s\S]*$/g, '$1'));
            }
            catch (e) {
                log("can't decode #json");
            }

            try {
                other = JSON.parse(response.json.html.replace(/^[\s\S]*?<pre id="other">([\s\S]*?)<\/pre>[\s\S]*$/g, '$1'));
            }
            catch (e) {
                log("can't decode #other");
            }

            var all = Array.prototype.concat.apply([], Object.values(files));

            all.sort();

            data = data.map((d) => trim(d.m + ' ' + d.u)).map(entities).join("\n");

            data = trim(data);

            if (data.indexOf("\n") > -1) {
                data = data.split("\n");
                data.sort();
            }
            else {
                data = data ? [data] : [];
            }

            return {
                files       : files,
                all         : all,
                data        : data,
                other       : other,
                watchdog    : response.json.watchdog,
                json        : response.json
            };
        });
}