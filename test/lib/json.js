'use strict';

const path          = require('path');
require(path.resolve(__dirname, '..', '..', 'lib', 'rootrequire'))(__dirname, '..', '..');
const config        = rootrequire('test', 'config');
const curljson      = rootrequire('lib', 'curljson')(config.parser);
const arglib        = rootrequire('lib', 'args');
const log           = rootrequire('lib', 'log');

var def = {
    // "url": url,
    "returnonlyhtml": false,
    // "ajaxwatchdog": { // default
    //     "waitafterlastajaxresponse":1000,
    //     "longestajaxrequest":5000
    // }
}

module.exports = function () {

    var alib = arglib(arguments);

    var opt = alib.object.shift({});

    var url = alib.string.shift();

    if (url) {
        opt.url = url;
    }

    var e = config.testendpoints;

    if (!/^https?:\/\/.+$/.test(opt.url)) {
        opt.url = e.protocol + '//' + e.hostname + ((e.port && (e.port != 80)) ? (':' + e.port) : '') + opt.url;
    }

    return curljson(Object.assign({}, def, opt));
};
