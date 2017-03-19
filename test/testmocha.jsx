'use strict';

const assert        = require('assert');
const path          = require('path');
const noop          = function () {};
const log           = console.log;
const hookhelper    = function (key) {return function () {log(key);}};
const fs            = require('fs');

// https://mochajs.org/#root-level-hooks vvv
    before(hookhelper('before root'));
    beforeEach(hookhelper('beforeEach root'));
    afterEach(hookhelper('afterEach root'));
    after(hookhelper('after root'));
// https://mochajs.org/#root-level-hooks ^^^

describe('Test mocha', function() {

    describe('lifecycles', function () {

        var tmp = '', hookhelper  = function (key) {return function () {log(key);tmp += ' '+key};}

        before(hookhelper('before-in'));
        after(hookhelper('after-in'));
        beforeEach(hookhelper('beforeEach-in'));
        afterEach(hookhelper('afterEach-in'));

        it('inner test', function () {
            assert.equal(' before-in beforeEach-in', tmp)
        })
    })


    describe('Array', function () { // only -> https://mochajs.org/#exclusive-tests

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
                    setTimeout(function () {
                        resolve();
                    }, 500)
                });
            });

            it('should return -1 when the value is not present', function() {
                assert.equal([1,2,3].indexOf(5), -1, 'Should not find 5 in array');
            });
        });

        //https://mochajs.org/#hooks
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


    });

    // https://mochajs.org/#inclusive-tests
    describe('only', function () {

        // describe.only('only', function () {
            // .only() - ONLY this will be executed in entire test FILE

        describe('only', function () {
            it('this will be executed', function() {
                // this test will be run
            });

            it("this woun't be executed", function() {
                // this test will also be run
            });
        });
    });

    // https://mochajs.org/#inclusive-tests
    describe('skip', function () {
        it('do this', noop)
        it.skip('but not this', noop)
    });

    describe('sequence and this.timeout() and this.slow()', function () {

        this.timeout(2000); // https://mochajs.org/#timeouts
        // inherited by all nested tests suites that do not override the value

        it('raz', function (done) {

            this.slow(10000); // only if longer then 10000 this test is considered as slo

            setTimeout(done, 1000)
        })

        it('dwa', function (done) {

            setTimeout(done, 1000)
        })
    });

    describe('inclusive tests', function () {
        it('skip this', noop)
        it('run only this', noop)
    });

    // https://mochajs.org/#pending-tests
    describe('pending test', function () {
        it('empty test')
    });


    // https://mochajs.org/#inclusive-tests
    describe('skip at runtime', function () {
        it('envIsGood - this.skip()', function () {
            var envIsGood = false;
            if (envIsGood) {
                // make assertions
            } else {
                this.skip();
            }
        })
    })

    describe('skip block by before -> this.skip()', function () {
        before(function() {
            var test = false;
            if (!test) {
                this.skip();
            }
        });
        it("this wan't be executed - entire block is skipped", noop)
    })

    // https://mochajs.org/#retry-tests
    describe('retry', function () {

        var file = path.resolve(__dirname, 'cache.txt');

        before(function () {

            log('before, initializing file with value 0: '+file);

            fs.writeFileSync(file, JSON.stringify(0), {
                flag: 'w' // not necessary flag but: https://nodejs.org/api/fs.html#fs_fs_open_path_flags_mode_callback
            });
        });

        beforeEach(function() {
            let counter = JSON.parse(fs.readFileSync(file));
            log('beforeEach - increse counter: ' + counter + ' to ' + (counter + 1))
            fs.writeFileSync(file, JSON.stringify(counter + 1), {
                flag: 'w'
            });
        });

        it('success only with value 4', function () {

            this.retries(3);

            log('test - failed: ')
            assert.equal(4, JSON.parse(fs.readFileSync(file)));
        })
    })

    // https://mochajs.org/#dynamically-generating-tests
    describe('generate tests', function () {

        function add() {
            return Array.prototype.slice.call(arguments).reduce(function(prev, curr) {
                return prev + curr;
            }, 0);
        }

        describe('add()', function() {
            var tests = [
                {args: [1, 2],       expected: 3},
                {args: [1, 2, 3],    expected: 6},
                {args: [1, 2, 3, 4], expected: 10}
            ];

            tests.forEach(function(test) {
                it('correctly adds ' + test.args.length + ' args', function() {
                    var res = add.apply(null, test.args);
                    assert.equal(res, test.expected);
                });
            });
        });

    });


});

// require(path.resolve(__dirname, 'test2.jsx'));
