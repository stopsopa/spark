'use strict';

// -- test --- vvv

// (function () {
//
//     console.log('------------ 1');
//
//     log('raz')('dwa')('trzy');
//
//     console.log('------------ 2');
//
//     log('-test-')('+test+')('testddd')('next');
//
//     console.log('------------ 3');
//
//     log.stack(4)('-test-')('+test+')('testddd')('next');
//
//     console.log('------------ stack default 2');
//
//     log.stack(2)('-test-')('+test+')('testddd')('next');
//
//     console.log('------------ json');
//
//     log.json({raz: "dwa", trzy: [5, 'osiem']})
//
//     log.stack(4).json({raz: "dwa", trzy: [5, 'osiem']})({raz: "dwa", trzy: [5, 'oddsiem']})
//
//     console.log('------------ dump');
//
//     log.dump({raz: "dwa", trzy: [5, 'osiem']});
//
//     console.log('------------ stack dump ');
//
//     log.stack(4).dump({raz: "dwa", trzy: [5, 'osiem']})({raz: "dwa", trzy: [5, 'oddsiem']})
//
//
// }())
// -- test --- ^^^




/**
 * log(arg1, arg2, ...)(arg1, arg2, ...)  - line and args
 * log.json(arg1, arg2, ...)(arg1, arg2, ...) - line and args as human readdable json
 * log.dump(arg1, arg2, ...)(arg1, arg2, ...) - line and args (exact description of types)
 *
 * log.stack(5)(arg1, arg2, ...)(arg1, arg2, ...)  - line and args
 * log.stack(5).json(arg1, arg2, ...)(arg1, arg2, ...) - line and args as human readdable json
 * log.stack(5).dump(arg1, arg2, ...)(arg1, arg2, ...) - line and args (exact description of types)
 *
 * and...
 * var tmp = log.stack(4)('test')
 *
 * tmp('test2')
 *
 * gives:
 * /opt/spark_dev/crawler.js:47
 * test
 * /opt/spark_dev/crawler.js:47
 * test2
 *
 */

// logic from https://github.com/gavinengel/magic-globals/blob/master/index.js
(function () {
    Object.defineProperty(global, '__stack', {
        get: function tmp() {
            var orig = Error.prepareStackTrace;
            Error.prepareStackTrace = function(_, stack){ return stack; };
            var err = new Error;
            Error.captureStackTrace(err, tmp);
            // Error.captureStackTrace(err, arguments.callee); // without 'use strict'
            var stack = err.stack;
            Error.prepareStackTrace = orig;
            return stack;
        }
    });
}());

/** returns line number when placing this in your code: __line */
// Object.defineProperty(global, '__line', {
//     get: function(){
//         return String("     " + __stack[2].getLineNumber()).slice(-5);
//     }
// });

// /** return filename (without directory path or file extension) when placing this in your code: __file */
// Object.defineProperty(global, '__file', {
//     get: function(){
//         return __stack[2].getFileName();
//     }
// });

global.__line = (function () {

    function rpad(s, n) {
        (typeof n === 'undefined') && (n = 5);

        if (s.length >= n) {
            return s;
        }

        return String(s + " ".repeat(n)).slice(0, n);
    }

    return function (n) {

        if (typeof n === 'undefined') {
            let tmp = [];
            for (let i in __stack) {
                tmp.push('stack: ' + rpad(i) + ' file:' + __stack[i].getFileName() + ':' + rpad(__stack[i].getLineNumber()) + ' ');
            }
            return tmp;
        }

        (typeof n === 'undefined') && (n = 1);

        if (!__stack[n]) {
            throw "n key (" + n + ") doesn't exist in __stack";
        }

        return __stack[n].getFileName() + ':' + rpad(__stack[n].getLineNumber());
    };
}());

var native = (function () {
    try {
        return console.log.bind(console);
    }
    catch (e) {
        return function () {};
    }
}());

var stack = false;

function log() {

    var s = (stack === false) ? 2 : stack;

    native(__line(s));

    if (this !== true) {
        s += 1;
    }

    stack = false;

    native.apply(this, Array.prototype.slice.call(arguments, 0));

    return function () {
        return log.stack(s).apply(true, Array.prototype.slice.call(arguments, 0));
    };
};

log.json = function () {

    var s = (stack === false) ? 2 : stack;

    native(__line(s));

    if (this !== true) {
        s += 1;
    }

    stack = false;

    Array.prototype.slice.call(arguments).forEach(function (a) {
        return (JSON.stringify(a, null, '  ') + '').split(/\n/g).forEach(function (l) {
            native(l)
        });
    });

    return function () {
        return log.stack(s).json.apply(true, Array.prototype.slice.call(arguments, 0));
    };
};

log.stack = function (n /* def: 2 */) {

    if (n === false) {
        stack = n;
        return log;
    }

    var nn = parseInt(n, 10);

    if (!Number.isInteger(n) || n < 0) {
        throw "Can't setup stack to '" + nn + "' ("+n+")";
    }

    stack = nn;

    return log;
};

(function (ll) {

    // http://stackoverflow.com/a/16608045/5560682
    function isObject(a) {
        // return (!!a) && (a.constructor === Object);
        return Object.prototype.toString.call(a) === '[object Object]'; // better in node.js to dealing with RowDataPacket object
    };
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    var type = (function (t) {
        return function (n) {
            if (n === undefined) {
                return 'Undefined';
            }
            if (n === null) {
                return 'Null';
            }

            t = typeof n;

            if (t === 'Function') {
                return t;
            }
            if (Number.isNaN(n)) {
                return "NaN";
            }
            if (t === 'number') {
                return (Number(n) === n && n % 1 === 0) ? 'Integer' : 'Float';
            }
            return n.constructor.name;
            // t = Object.prototype.toString.call(n);
            // if (t.indexOf('[object ') === 0) {
            //     t = t.substring(8);
            //     t = t.substring(0, t.length - 1);
            // }
            // return t;
        };
    }());

    function each(obj, fn, context) {
        var r;
        if (isArray(obj)) {
            for (var i = 0, l = obj.length ; i < l ; ++i) {
                if (fn.call(context, obj[i], i) === false) {
                    return;
                }
            }
        }
        else if (isObject(obj)) {
            for (var i in obj) {
                if (fn.call(context, obj[i], i) === false) {
                    return;
                }
            }
        }
    }

    function inner(d, l, index) {
        (typeof l === 'undefined') && (l = 0);
        // (l === 0) && native(__line(5));
        index = (typeof index === 'undefined') ? '' : '<' + index + '> ';
        var isOb = isObject(d);
        if (isOb || isArray(d)) {
            ll(('  '.repeat(l)) + index + type(d) + ' ' + ((isOb) ? '{' :'[') );
            each(d, function (v, i) {
                inner(v, l + 1, i);
            });
            ll(('  '.repeat(l)) + ((isOb) ? '}' :']') );
        }
        else {
            ll(
                ('  '.repeat(l)) +
                index +
                '[' + type(d) + ']: ' +
                '>' + (d) + '<'
            );
        }
    }

    log.dump = function () {

        var s = (stack === false) ? 2 : stack;

        native(__line(s));

        if (this !== true) {
            s += 1;
        }

        stack = false;

        Array.prototype.slice.call(arguments).forEach(function (d) {
            return inner(d);
        });

        return function () {
            return log.stack(s).dump.apply(true, Array.prototype.slice.call(arguments, 0));
        };
    };

}(native));

module.exports = log;
