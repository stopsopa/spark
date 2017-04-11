'use strict';

const assert = require('assert');

assert.same = function (a, b, message) {
    return assert.equal(a, b, message);
};

module.exports = assert;