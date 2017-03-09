// source https://github.com/segmentio/nightmare/blob/master/lib/preload.js
// or file in node modules preload.js

(function () {
    var cache = [];
    document.addEventListener('DOMContentLoaded', function () {
        window.log = (function () {
            try {
                return console.log;
            }catch (e) {
                return function () {}
            }
        }());
        var c;
        while (c = cache.shift()) {
            log.apply(this, c);
        }
    });

    window.log = function () {
        cache.push(Array.prototype.slice.call(arguments));
    };
}());

if (typeof require !== 'undefined') {
    window.__nightmare = {};
    __nightmare.ipc = require('electron').ipcRenderer;
    __nightmare.sliced = require('sliced');

    // Listen for error events
    window.addEventListener('error', function(e) {
        __nightmare.ipc.send('page', 'error', e.message, e.error.stack);
    });

    (function(){
        // prevent 'unload' and 'beforeunload' from being bound
        var defaultAddEventListener = window.addEventListener;
        window.addEventListener = function (type) {
            if (type === 'unload' || type === 'beforeunload') {
                return;
            }
            defaultAddEventListener.apply(window, arguments);
        };

        // prevent 'onunload' and 'onbeforeunload' from being set
        Object.defineProperties(window, {
            onunload: {
                enumerable: true,
                writable: false,
                value: null
            },
            onbeforeunload: {
                enumerable: true,
                writable: false,
                value: null
            }
        });

        // listen for console.log
        var defaultLog = console.log;
        console.log = function() {
            __nightmare.ipc.send('console', 'log', __nightmare.sliced(arguments));
            return defaultLog.apply(this, arguments);
        };

        // listen for console.warn
        var defaultWarn = console.warn;
        console.warn = function() {
            __nightmare.ipc.send('console', 'warn', __nightmare.sliced(arguments));
            return defaultWarn.apply(this, arguments);
        };

        // listen for console.error
        var defaultError = console.error;
        console.error = function() {
            __nightmare.ipc.send('console', 'error', __nightmare.sliced(arguments));
            return defaultError.apply(this, arguments);
        };

        // overwrite the default alert
        window.alert = function(message){
            __nightmare.ipc.send('page', 'alert', message);
        };

        // overwrite the default prompt
        window.prompt = function(message, defaultResponse){
            __nightmare.ipc.send('page', 'prompt', message, defaultResponse);
        }

        // overwrite the default confirm
        window.confirm = function(message, defaultResponse){
            __nightmare.ipc.send('page', 'confirm', message, defaultResponse);
        }
    })()

    log('preload.js');

};


(function () {

    function unique(pattern) {
        pattern || (pattern = 'xyxyxyxyxyxyxyxyxy');
        return pattern.replace(/[xy]/g,
            function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    };

    (function () {

        if (window.XMLHttpRequest.prototype.list) {
            return log('window.XMLHttpRequest.prototype.list already defined');
        }

        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        function over(method, on, off) {

            var old = window.XMLHttpRequest.prototype[method];

            if (!old.old) {

                var stack = [];

                window.XMLHttpRequest.prototype[on] = function (fn) {
                    if (typeof fn === 'function') {
                        stack.push(fn);
                    }
                }

                window.XMLHttpRequest.prototype[off] = function (fn) {
                    for (var i = 0, l = stack.length ; i < l ; i += 1 ) {
                        if (stack[i] === fn) {
                            stack.splice(i, 1);
                            break;
                        }
                    }
                }

                window.XMLHttpRequest.prototype[method] = function () {
                    var args = Array.prototype.slice.call(arguments);

                    for (var i = 0, l = stack.length ; i < l ; i += 1 ) {
                        stack[i].apply(this, args);
                    }

                    return old.apply(this, args);
                }

                window.XMLHttpRequest.prototype[method].old = old;
            }
        }

        var list = {}, c, on, off, t;
        for (var i in XMLHttpRequest.prototype) {
            try {
                t = typeof XMLHttpRequest.prototype[i];
                if (t === 'function') {

                    c = capitalizeFirstLetter(i);

                    on  = 'on' + c;

                    off = 'off' + c;

                    over(i, on, off);

                    list[i] = [on, off];
                    log('overrided: ', i);
                }
                else {
                    //                        log("can't override - not function: ", i)
                }
            }
            catch (e) {
                //                    log("can't extend: ", i);
            }
        }

        window.XMLHttpRequest.prototype.list = list;

        log('list: ', list)

    }());

    (function () {

        if (window.XMLHttpRequest.prototype.onAllFinished) {
            return log('onAllFinished is already defined');
        }

        window.XMLHttpRequest.prototype.onAllFinished = function (finishedfn, debouncetime /* 1000 */, fusetime /* 1500 */) {

            // to prevent bind two times
            window.XMLHttpRequest.prototype.onAllFinished = function () {
                log('second attempt to use onAllFinished - aborted');
            };

            if (typeof debouncetime === 'undefined') {
                log('debouncetime is not defined')
                debouncetime = 1000;
            }

            if (debouncetime < 100) {
                log('debouncetime is smaller then debouncetime');
                debouncetime = 100;
            }

            if (typeof fusetime === 'undefined' || fusetime < debouncetime) {
                log('automatically setup fusetime')
                fusetime = debouncetime + 500;
            }

            function debounce(fn, delay) {
                var timer = null;
                return function () {
                    var context = this, args = arguments;
                    clearTimeout(timer);
                    timer = setTimeout(function () {
                        fn.apply(context, args);
                    }, delay);
                };
            };

            (function () {

                var urls = {};

                var counter = 0;

                function up (key, args) {

                    log('up', key, args)

                    urls[key] = args;

                    counter += 1;

                    initEmergency(key);
                }
                function down(key) {

                    log('down', key)
                    counter -= 1;
                    delete urls[key];
                    initEmergency(key);
                    if (counter === 0) {
                        onReady();
                    }
                }
                var emergency;
                function initEmergency(key) {
                    if (!emergency) {
                        emergency = debounce(function () {
                            if (finishedfn) {
                                var tmp = [];
                                for (var i in urls) {
                                    tmp.push(urls[i]);
                                }
                                finishedfn({
                                    notFinishedAsynchronousResponses: tmp,
                                    flow: 'incomplete',
                                    counter: counter
                                });
                            }
                            finishedfn = false;
                        }, fusetime);
                    }
                    emergency();
                }
                var onReady = debounce(function () {
                    if (counter === 0) {
                        finishedfn && finishedfn({
                            notFinishedAsynchronousResponses: [],
                            flow: 'correct',
                            counter: counter
                        });
                        finishedfn = false;
                    }
                }, debouncetime);

                (function (old) {
                    if (old && !old.old) {
                        // log("override fetch")
                        fetch = function () {

                            args = Array.prototype.slice.call(arguments);
                            args = ['fetch'].concat(args);

                            var key = unique();

                            up(key, args)

                            var promise = old.apply(this, Array.prototype.slice.call(arguments));
                            return promise.then(function () {
                                // log('fetch down: ' +  url, JSON.stringify(urls, null, 2))
                                down(key);
                            });
                        }
                        fetch.old = old;
                    }
                    else {
                        // log("don't override fetch")
                    }
                }(window.fetch));

                var args;
                XMLHttpRequest.prototype.onOpen(function () {
                    args = Array.prototype.slice.call(arguments);
                    args = ['xhr'].concat(args);
                });

                XMLHttpRequest.prototype.onSend(function () {

                    var key = unique();

                    up(key, args);

                    var xhr = this;
                    this.addEventListener('readystatechange', function (e) {
                        if (xhr.readyState === 4) {
                            down(key);
                        }
                    })
                });

                onReady();
            }())
        };

        if (!window.__nightmare) {
            // only for browser mode to et
            window.XMLHttpRequest.prototype.onAllFinished(function (status) {
                log('onAllFinished', status)
            }, 1000, 3000);
        }

        // normally it shouldn't be called here, it's only for testing
    }())

}())

