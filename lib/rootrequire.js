'use strict';

/**
 * https://gist.github.com/branneman/8048520#6-the-hack
 *
 * const path          = require('path');
 * require(path.resolve(__dirname, 'lib', 'rootrequire.js'))(__dirname, '.');
 * .. and later use like ..
 * const lib = rootrequire('lib', 'lib.js');
 */
module.exports = function () {

    const args = Array.prototype.slice.call(arguments);

    if (!global.rootrequire) {

        const path          = require("path");

        process.env.NODE_PATH = path.resolve.apply(this, args);

        global.rootrequire = function () {
            var name = path.join.apply(this, Array.prototype.slice.call(arguments));
            return require(path.resolve.apply(this, args.concat([name])));
        }
    }
}