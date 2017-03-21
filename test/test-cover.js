'use strict';

const assert = require('assert');
const path = require('path');
const log = require(path.resolve(__dirname, '..', 'lib', 'log.js'));

describe('Simple test for test coverage', function () {
    it('log', function () {
        assert.equal(undefined, log('line of code'));
    });
});