'use strict';

/**

const assert        = require('assert');
const path          = require('path');
const glob          = require("glob");
const overridetests = require(path.resolve(__dirname, '..', 'lib', 'overridetests.jsx'));

var engines = glob.sync(path.resolve(__dirname, '..', 'lib', 'db', '*')).map(function (path) {
    return path.replace(/^.*\/([^\/]+)$/, '$1');
})

 override('database driver tests', engines, function () {

    describe('engine test suites', function () {
        it('first test', function () {
            assert.equal('true', 'true');
        });
    });

});
 */
module.exports = function (label, list, tests) {

    describe(label, function () {
        list.forEach(function (driver) {

            var od = describe, oi = it;

            describe = function () {
                var args = Array.prototype.slice.call(arguments);

                if (args.length) {
                    args[0] = driver + ": " + args[0];
                }

                return od.apply(this, args);
            }

            it = function () {
                var args = Array.prototype.slice.call(arguments);

                if (args.length) {
                    args[0] = driver + ": " + args[0];
                }

                return oi.apply(this, args);
            }

            tests();

            describe    = od;
            it          = oi;
        });
    });
}
