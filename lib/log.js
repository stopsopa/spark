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

/** return filename (without directory path or file extension) when placing this in your code: __file */
Object.defineProperty(global, '__file', {
    get: function(){
        return __stack[2].getFileName()
    }
});

function log() {
    log.log(__file + ':' + __line);
    log.log.apply(this, Array.prototype.slice.call(arguments))
}
log.log = (function () {
    try {
        return console.log.bind(console);
    }
    catch (e) {
        return function () {};
    }
}());

log.json = function () {
    log.log(__file + ':' + __line);
    Array.prototype.slice.call(arguments).forEach(function (a) {
        return (JSON.stringify(a, null, '  ') + '').split(/\n/g).forEach(function (l) {
            log.log(l)
        });
    });
}

module.exports = log;