'use strict';

/**
 * https://gist.github.com/branneman/8048520#6-the-hack
 *
 * const path          = require('path');
 * require(path.resolve(__dirname, 'lib', 'rootrequire.jsx'))(__dirname, '..');
 */
module.exports = function () {

    const args = Array.prototype.slice.call(arguments);

    if (!global.rootrequire) {

        const path          = require("path");

        process.env.NODE_PATH = path.resolve.apply(this, args);

        global.rootrequire = function (name) {
            return require(path.resolve.apply(this, args.concat([name])));
        }
    }
}