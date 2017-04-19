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
        return String("     " + __stack[2].getLineNumber()).slice(-5);
    }
});

/** return filename (without directory path or file extension) when placing this in your code: __file */
Object.defineProperty(global, '__file', {
    get: function(){
        return __stack[2].getFileName()
    }
});

// http://stackoverflow.com/a/16608045/5560682
function isObject(a) {
    return (!!a) && (a.constructor === Object);
};
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

var log = (function () {
    try {
        return console.log;
    }
    catch (e) {
        return function () {};
    }
}());

log.line = function () {
    log(__file + ':' + __line);
    const args = Array.prototype.slice.call(arguments);
    log.apply(this, args)
}

log.json = function () {
    log(__file + ':' + __line);

    const args = Array.prototype.slice.call(arguments);

    args.forEach(function (a) {
        if (isArray(a) || isObject(a)) {
            a = JSON.stringify(a, null, '  ').split(/\n/g);

            for (var i = 0, l = a.length ; i < l ; i += 1 ) {
                log(a[i]);
            }
        }
        else {
            log(a);
        }
    });
}

module.exports = log;