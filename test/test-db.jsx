'use strict';

const assert        = require('assert');
const path          = require('path');
const glob          = require("glob");
const overridetests = require(path.resolve(__dirname, '..', 'lib', 'overridetests.jsx'));


var engines = glob.sync(path.resolve(__dirname, '..', 'lib', 'db', '*')).map(function (path) {
    return path.replace(/^.*\/([^\/]+)$/, '$1');
})

overridetests('database driver tests', engines, function () {

    describe('engine test suites', function () {
        it('first test', function () {
            assert.equal('true', 'true');
        });
    });

});


