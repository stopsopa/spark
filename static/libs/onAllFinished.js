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

// Object.values polyfill
if (!Object.values) {
    log('Applying Object.values polyfill');
    // http://stackoverflow.com/a/38748490
    Object.values = function (obj) {
        return Object.keys(obj).map(function(key) {
            return obj[key];
        });
    }
}
else {
    log('Object.values polyfill is not necessary');
}

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

        var list = {}, c, on, off;
        for (var i in XMLHttpRequest.prototype) {
            try {
                if (typeof XMLHttpRequest.prototype[i] === 'function') {

                    c = capitalizeFirstLetter(i);

                    on  = 'on' + c;

                    off = 'off' + c;

                    over(i, on, off);

                    list[i] = [on, off];
                }
            }
            catch (e) {
                //                    log("can't extend: ", i);
            }
        }

        window.XMLHttpRequest.prototype.list = list;

        log('list:', Object.keys(list).map(function (e) {return '[on|off]' + capitalizeFirstLetter(e)}).join(', '));

    }());

    (function () {

        if (window.XMLHttpRequest.prototype.onAllFinished) {
            return log('onAllFinished is already defined');
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

        var status = 'pending', debug = false, urls = {}, non200 = {}, cache = [],
            promise, waitafterlastajaxresponse, longestajaxrequest, flag,
            emergencyFn, onReadyFn, resolveTmp;

        var l = function () {
            cache.push(Array.prototype.slice.call(arguments));
        };

        function initEmergency() {
            if (longestajaxrequest) {
                if (!emergencyFn) {
                    emergencyFn = debounce(function (d) {
                        if (status === 'pending') {
                            status = 'resolved';
                            l('triggering onAllFinished: incomplete');
                            d = Object.values(urls);
                            resolveTmp({
                                notFinishedAsynchronousRequests: d,
                                finishedOnTimeAsynchronousRequestsButWithNon200StatusCode: Object.values(non200),
                                flow: 'incomplete'
                            });
                        }
                    }, longestajaxrequest);
                }
                emergencyFn();
            }
        };
        function onReady() {
            // log(waitafterlastajaxresponse, !onReadyFn, Object.keys(urls).length, status === 'pending', urls)
            if (waitafterlastajaxresponse) {
                if (!onReadyFn) {
                    onReadyFn = debounce(function (c) {
                        c = Object.keys(urls).length;
                        if (c === 0) {
                            if (status === 'pending') {
                                status = 'resolved';
                                l('triggering onAllFinished: correct');
                                resolveTmp({
                                    notFinishedAsynchronousRequests: [],
                                    finishedOnTimeAsynchronousRequestsButWithNon200StatusCode: Object.values(non200),
                                    flow: 'correct'
                                });
                            }
                        }
                    }, waitafterlastajaxresponse);
                }
                onReadyFn();
            }
        };
        function up (key, args) {

            urls[key] = args;

            initEmergency(key);
        };
        function down(key, code, args) {
            delete urls[key];
            if (code != 200) {
                non200[key] = {
                    request: args,
                    statusCode: /^\d{3}$/.test(code) ? parseInt(code, 10) : (code + '')
                };
            }
            initEmergency(key);
            if (Object.keys(urls).length === 0) {
                onReady();
            }
        };

        // duck puching fetch
        (function (old) {

            if (!old) {
                return log('fetch is not available');
            }

            if (old.old) {
                return l('fetch is already overrided');
            }

            window.fetch = function () {

                var args = Array.prototype.slice.call(arguments);

                var opt = (typeof args[1] === 'object') ? args[1] : {};

                var cache = ['fetch', (typeof opt.method === 'string') ? opt.method.toUpperCase() : 'GET', args[0]];

                var key = unique();

                up(key, cache);

                var promise = old.apply(this, args);

                promise.then(function (response) {
                    down(key, response.status, cache);
                }, function () {
                    down(key, 0, cache);
                });

                return promise;
            }
            fetch.old = old;

            log('fetch overrided');

        }(window.fetch));

        // duck puching XMLHttpRequest
        (function (args) {

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
                        down(key, xhr.status, args);
                    }
                })
            });

            log('ajax overrided');
        }());

        promise = new Promise(function (resolve) {
            resolveTmp = resolve;
        });

        window.XMLHttpRequest.prototype.onAllFinished = function (/* waitafterlastajaxresponse:1000, longestajaxrequest:1500, debug:false, flag: '-default-' */) {

            var args = Array.prototype.slice.call(arguments);

            window.XMLHttpRequest.prototype.onAllFinished = function () {

                var argsnow = Array.prototype.slice.call(arguments);

                if (argsnow.length) {

                    log('onAllFinished arguments ignored, promise already initialized', 'now given args:', {
                        waitafterlastajaxresponse: argsnow[0],
                        longestajaxrequest: argsnow[1],
                        debug: (typeof argsnow[2] === 'undefined') ? 'default:false' : argsnow[2],
                        flag: argsnow[3]
                    }, 'previousely given args:', {
                        waitafterlastajaxresponse: waitafterlastajaxresponse,
                        longestajaxrequest: longestajaxrequest,
                        debug: debug,
                        flag: flag
                    });
                }

                return promise;
            };

            waitafterlastajaxresponse   = args[0];
            longestajaxrequest          = args[1];
            debug                       = (typeof args[2] === 'undefined') ? false : args[2];
            flag                        = args[3] || '-default-';

            if (debug) {

                l = function () {
                    log.apply(console, arguments);
                };

                (function (tmp) {
                    while (tmp = cache.shift())
                        log.apply(console, tmp);
                }());
            }

            if (!waitafterlastajaxresponse) {
                waitafterlastajaxresponse = 1000;
                log('waitafterlastajaxresponse unspecified, setup to default value: ' + waitafterlastajaxresponse)
            }

            if (waitafterlastajaxresponse < 1000) {
                waitafterlastajaxresponse = 1000;
                log('waitafterlastajaxresponse is smaller then waitafterlastajaxresponse, fixed to: ' + waitafterlastajaxresponse);
            }

            if (!longestajaxrequest) {
                longestajaxrequest = waitafterlastajaxresponse + 4000;
                log('longestajaxrequest unspecified, autosetup to: ' + longestajaxrequest)
            }

            if (longestajaxrequest < waitafterlastajaxresponse) {
                longestajaxrequest = waitafterlastajaxresponse + 500;
                log('longestajaxrequest lt waitafterlastajaxresponse, fixed to: ' + longestajaxrequest)
            }

            log('onAllFinished initialized: ' + JSON.stringify({
                waitafterlastajaxresponse: waitafterlastajaxresponse,
                longestajaxrequest: longestajaxrequest,
                debug: debug,
                flag: flag
            }));

            onReady();

            return promise;
        };
    }());
}());