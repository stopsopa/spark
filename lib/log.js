// 'use strict';

// logic from https://github.com/gavinengel/magic-globals/blob/master/index.js
Object.defineProperty(global, '__stack', {
    get: function(){
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack){ return stack; };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

/** returns line number when placing this in your code: __line */
Object.defineProperty(global, '__line', {
    get: function(){
        return __stack[2].getLineNumber();
    }
});
Object.defineProperty(global, '___line', {
    get: function(){
        return __stack[5].getLineNumber();
    }
});

/** return filename (without directory path or file extension) when placing this in your code: __file */
Object.defineProperty(global, '__file', {
    get: function(){
        return __stack[2].getFileName()
    }
});
Object.defineProperty(global, '___file', {
    get: function(){
        return __stack[5].getFileName()
    }
});

var native = (function () {
    try {
        return console.log.bind(console);
    }
    catch (e) {
        return function () {};
    }
}());

function log() {
    native(__file + ':' + __line);
    native.apply(this, Array.prototype.slice.call(arguments))
}

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
        (l === 0) && native(___file + ':' + ___line);
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

    log.log = function () {
        return Array.prototype.slice.call(arguments).forEach(function (d) {
            return inner(d);
        });
    };
}(native));

log.json = function () {
    native(__file + ':' + __line);
    Array.prototype.slice.call(arguments).forEach(function (a) {
        return (JSON.stringify(a, null, '  ') + '').split(/\n/g).forEach(function (l) {
            native(l)
        });
    });
}

module.exports = log;