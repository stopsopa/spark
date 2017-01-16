(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'], function (exports) {
            factory((root.ajax = exports));
        });
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        factory((root.ajax = factory));
    }
}(this, function (exports) {

    //use b in some fashion.
    var log = (function () {try {return console.log}catch (e) {return function () {}}}());

    function createXHR() {
        if (window.XDomainRequest) return new XDomainRequest();     // code for IE7+, Firefox, Chrome, Opera, Safari
        if (window.XMLHttpRequest) return new XMLHttpRequest();     // code for IE7+, Firefox, Chrome, Opera, Safari
        if (window.ActiveXObject)  return new ActiveXObject("Microsoft.XMLHTTP");  //   code for IE6, IE5
        throw "Can't create xhr object";
    };

    // http://stackoverflow.com/a/16608045/5560682
    function isObject(a) {
        return (!!a) && (a.constructor === Object);
    };

    var def = {
        method: 'GET',
        data: '',
        contentType: '',
        tryDecodeJson: true
    };

    function promise(url, options, manipulatexhrbeforesend) {

        options = Object.assign({}, def, options || {});

        options.method = options.method.toUpperCase();

        var xhr = createXHR();

        xhr.open(options.method || 'GET', url, true);

        if (options.contentType) {
            xhr.setRequestHeader('Content-type', options.contentType);
        }

        manipulatexhrbeforesend && manipulatexhrbeforesend(xhr);

        var resolve, reject, prom = new Promise(function (resolv, rejec) {
            resolve = resolv;
            reject = rejec;
        });

        prom.catch(function () {});

        prom.always = function (fn) {
            prom.then(function (arg1) {
                fn.apply(this, ['done'].concat(arg1))
            }, function (arg1) {
                fn.apply(this, ['fail'].concat(arg1))
            });
            return prom;
        }
        prom.done = function (fn) {
            prom.then(function (arg1) {
                fn.apply(this, arg1)
            }, function () {});
            return prom;
        }
        prom.fail = function (fn) {
            prom.then(function () {}, function (arg1) {
                fn.apply(this, arg1)
            });
            return prom;
        }

        xhr.onreadystatechange = function () {

            if (xhr.readyState === 4) {

                if (xhr.status === 200) {

                    var data = xhr.responseText;

                    if (options.tryDecodeJson) {
                        try {
                            data = JSON.parse(data);
                        }
                        catch (e) {

                            var header = xhr.getResponseHeader('content-type');

                            if (typeof header === 'string') {

                                header = header.toUpperCase();

                                if ((header.indexOf('json') + 1)) {
                                    throw "Failed to decode json: " + url + "\nerror: " + e;
                                }
                            }
                        }
                    }
                    resolve([data, xhr]);
                }
                else {
                    reject([xhr.status, xhr]);
                }
            }
        };

        if (options.data) {
            xhr.send(options.data);
        }
        else {
            xhr.send();
        }

        return prom;
    };

    exports.get = function (url, options, manipulatexhrbeforesend) {

        options = Object.assign({}, def, options || {}, {
            method: 'get',
        });

        var query = [];

        if (isObject(options.data)) {
            for (var key in options.data) {
                query.push( encodeURIComponent(key) + '=' + encodeURIComponent(options.data[key]) );
            }
        }

        if (query.length) {
            url += (url.indexOf('?') + 1) ? '&' : '?';
            url += query.join('&');
        }

        return promise(url, options, manipulatexhrbeforesend)
    }

    exports.post = function (url, options, manipulatexhrbeforesend) {

        options = Object.assign({}, def, options || {}, {
            method: 'post',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
        });

        var query = [];

        if (isObject(options.data)) {
            for (var key in options.data) {
                query.push( encodeURIComponent(key) + '=' + encodeURIComponent(options.data[key]) );
            }
        }

        if (query.length) {
            options.data = query.join('&');
        }

        return promise(url, options, manipulatexhrbeforesend)
    }

    exports.postMultipart = function () {
        throw 'postMultipart not implemented yet...';
    }

    exports.json = function (url, options, manipulatexhrbeforesend) {

        options = Object.assign({}, def, options || {}, {
            method: 'post',
            contentType: 'application/json; charset=utf-8'
        });

        options.method = options.data ? 'post' : 'get';

        options.data = JSON.stringify(options.data);

        return promise(url, options, manipulatexhrbeforesend)
    }

    exports.promise = promise;
}));



