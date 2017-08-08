/**
 * @author Szymon Działowski
 * @license MIT License (c) copyright 2017-present original author or authors
 * @homepage https://github.com/stopsopa/webpack3
 */

'use strict';

module.exports = (function () {
    try {
        return console.log;
    }
    catch (e) {
        return function () {}
    }
}());