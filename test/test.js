var assert = require('assert');

describe('Array', function() {
    describe('#indexOf()', function() {
        it('should return -1 when the value is not present', function() {
            assert.equal(-1, [1,2,3].indexOf(4));
        });
        it('test by done', function (done) {
            new Promise(function (resolve) {
                assert.ok(true);
                resolve();
            })
            .then(done);
        });
        it('test by returning promise', function () {
            return new Promise(function (resolve) {
                assert.ok(true);
                resolve();
            });
        });

        it('should return -1 when the value is not present', function() {
            assert.equal([1,2,3].indexOf(5), -1, 'Should not find 5 in array');
        });
    });

    describe("let's test “BDD”-style interface", function () {

        var list = '';

        before(function() {
            list += 'before';
            // runs before all tests in this block
        });

        after('Can be also description', function() {
            list += ' after';
            // runs after all tests in this block
        });

        beforeEach(function() {
            list += ' beforeEach';
            // runs before each test in this block
        });

        afterEach(function() {
            list += ' afterEach';
            // runs after each test in this block
        });

        it("main test", function () {
            list += ' testitself';
            assert.equal(list, 'before beforeEach testitself');
        });

        it("main test next", function () {
            list += ' each';
            assert.equal(list, 'before beforeEach testitself afterEach beforeEach each');
        });
    });


    // gdzie skończyłem https://mochajs.org/#root-level-hooks

});