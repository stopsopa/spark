'use strict';

const path          = require('path');

require(path.resolve(__dirname, 'rootrequire'))(__dirname, '..');

const log           = rootrequire('lib', 'log');

// Object.values polyfill
if (!Object.values) {
    log('Applying Object.values polyfill');
    // http://stackoverflow.com/a/38748490
    Object.values = function (obj) {
        return Object.keys(obj).map(function(key) {
            return obj[key];
        });
    }
}
else {
    log('Object.values polyfill is not necessary');
}