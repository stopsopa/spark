'use strict';

const http          = require('http');
const path          = require('path');
const Nightmare     = require('nightmare');
const log           = console.log;
const assert        = console.assert;
const bodyParser    = require('body-parser');
const express       = require('express');
const url           = require('url');
const app           = express();

assert(process.argv.length > 3, "try to call for example 'node " + path.basename(__filename) + " 0.0.0.0 80'");

const ip = process.argv[2];

// http://www.w3resource.com/javascript/form/ip-address-validation.php
assert(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip),
    "first argument should have format of ip address eg: 127.168.10.105 and is '" + ip + "'"
);

const port = process.argv[3];

assert(port >= 0 && port <= 65535, "port beyond range 0 - 65535 : '" + port + "'");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json()); // https://github.com/expressjs/body-parser#expressconnect-top-level-generic

const nightmaredef = { // https://github.com/segmentio/nightmare#api
    gotoTimeout: 30000, // 20 sec [This will throw an exception if the .goto()]
    loadTimeout: 35000, // 10 sec [loadTimeout should be longer then gotoTimeout otherwise exception from gotoTimeout will be thrown]

    waitTimeout: 30000, // 20 sec [This will throw an exception if the .wait() didn't return true within the set timeframe.]
    pollInterval: 60, // How long to wait between checks for the .wait() condition to be successful.
    executionTimeout: 30000, // 10 sec [The maxiumum amount of time to wait for an .evaluate() statement to complete.]
    'ignore-certificate-errors': true,
    show: false,
    dock: false,
    // openDevTools: { // to enable developer tools
    //     mode: 'detach'
    // },
    alwaysOnTop: false,
    webPreferences: {
        preload: path.resolve('static', 'libs', "onAllFinished.js"), // (custom preload script preload.js) https://github.com/segmentio/nightmare#custom-preload-script
        //alternative: preload: "absolute/path/to/custom-script.js"
        partition: 'nopersist' // always clear cache
    }
};

const defopt = {
    // url: 'http://...', // required parameter
    nightmare: {}, // default in nightmaredef - native nightmare.js parameters
    ajaxwatchdog: { // false - disable watchdog at all,
        // but then you need to tell prerender when
        // take the snapshot of document by calling manually
        // window.nmsc = window.nmsc || []; nmsc.push(true);
        waitafterlastajaxresponse: 3000, // 1 sec
        longestajaxrequest: 15000 // 5 sec
    },

    headers : {},
    // readyid: 'readyid', // don't change anything, you just can use predefined id instead of random
    nmsc: 'nmsc', // if setup for "mynamespace" then triggering manually looks like
    // window.mynamespace = window.mynamespace || []; mynamespace.push(true);
    // so this is namespace where spark deploys all its tools in browser
    returnonlyhtml: false, // false - return json rich response, true - return only html as a text

    firstrequesttype: 'get', // 'head' or in some rare circumstances 'get' ('get' - worse performance)
    firstrequestheaders: {
        'User-Agent' : 'Electron/version',
        Connection: 'close'
    }
};

// http://stackoverflow.com/a/16608045/5560682
function isObject(a) {
    return (!!a) && (a.constructor === Object);
};

function unique(pattern) {
    pattern || (pattern = 'xyx');
    return pattern.replace(/[xy]/g,
        function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

function curl(uri, method, headers) {

    uri = url.parse(uri);

    var options = {
        method  : method,
        host    : uri.hostname,
        port    : uri.port,
        path    : uri.path,
        headers : Object.assign({}, headers || {}, {
            Host: uri.hostname
        })
    };

    return new Promise(function (resolve, reject) {

        var req = http.request(options, function(res) {

            res.setEncoding('utf8');

            resolve(res);
        });

        req.on('error', function(e) {
            reject(e)
        });

        req.end();
    });
}

app.all('/fetch', (req, res) => {

    var
        params  = req.query,
        error   = false
    ;

    var json = (function () {
        var stop = false;
        return function (code, data) {

            if (stop) {
                return;
            }

            try {

                res.setHeader('Content-Type', 'application/json; charset=utf-8');

                res.statusCode = code;

                if (typeof data === 'string') {

                    return res.end(data);
                }

                data.statusCode = code;

                res.end(JSON.stringify(data));

            }
            catch (e) {
                log('express error: ', e)
            }

            stop = true;
        }
    }());

    try {

        if (req.method === 'POST' && isObject(req.body)) { // http://expressjs.com/en/api.html#req

            // interesting failure: req.body is not object when urlencoded post ???
            // log('post: ', req.body, req.method, isObject(req.body), typeof req.body, req.body.constructor);
            Object.assign(params, req.body);
        }

        params                  = Object.assign({}, defopt, params);

        params.u                = unique();

        params.nightmare        = Object.assign({}, nightmaredef, params.nightmare || {});

        if (!params.nmsc) {
            params.nmsc = 'nmsc';
        }

        if (!params.url) {
            error = "provide 'url' as http get, post or json param";
        }

        if ( ! /^https?:\/\//i.test(params.url)) {
            error = "provide absolute path that beginning from http[s]://...";
        }

        params.url = (function () {
            var uri = url.parse(params.url);
            return uri.protocol + '//' + uri.host + uri.path;
        }());

        if (error) {
            return json(500, {
                error: 'crawler',
                code: 'wrong-input-parameters',
                data: error
            });
        }

        if (!params.readyid) {
            params.readyid = 'readyid_' + (new Date()).getTime();
        }

        log('[browser:'+params.u+':init]: ' + params.url)


        // hardcoded for now
        params.ajaxwatchdog = 8000;



        curl(params.url, params.firstrequesttype, params.firstrequestheaders)
            .then(function (res) {

                if (res.statusCode !== 200) {

                    return json(500, {
                        error: 'prerequest',
                        code: 'wrong-status-code',
                        data: {
                            status: res.statusCode,
                            headers: res.headers
                        }
                    });
                }

                var okMimeType = true, mime = '-notfound-';

                try {
                    // no mime type example https://cran.r-project.org/doc/manuals/NEWS.1
                    mime    = res.headers['content-type'];

                    if (mime.toLowerCase().indexOf('text/html') > -1) {
                        okMimeType = true;
                    }
                    else {
                        okMimeType = false;
                    }
                }
                catch (e) {
                    okMimeType = true;
                }

                if (!okMimeType) {
                    throw "mime type '" + mime + "-'";
                }

                var night = Nightmare(params.nightmare);

                var events = {};

                night
                    .on('console', function () {

                        var args = Array.prototype.slice.call(arguments);

                        var type = args[0];

                        args[0] = '[browser:'+params.u+':'+type+']';

                        if (!events.console) {
                            events.console = {};
                        }

                        if (!events.console[type]) {
                            events.console[type] = [];
                        }

                        events.console[type].push(args);

                        log.apply(this, args);
                    })
                    .on('page', function (type) {

                        var args = Array.prototype.slice.call(arguments);

                        switch(type) {
                            case 'error':
                                return json(500, {
                                    error: 'client',
                                    code: 'page-general-error',
                                    data: args
                                });
                                break;
                            case 'alert':
                            case 'prompt':
                            case 'confirm':
                                args[0] = '[browser:'+params.u+':'+args[0]+':type:'+type+']';

                                return log.apply(this, args);
                            default:
                        }
                    })
                    .once('did-get-response-details', function (event, status, newURL, originalURL, httpResponseCode, requestMethod, referrer, headers, resourceType) {
                        // https://github.com/segmentio/nightmare#onevent-callback
                        // https://github.com/electron/electron/blob/master/docs/api/web-contents.md#class-webcontents
                        // log('did-get-response-details', Array.prototype.slice.call(arguments)[7])
                        var data = Array.prototype.slice.call(arguments);
                        data.push({
                            doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-get-response-details'
                        });
                        events['did-get-response-details'] = data;
                    })
                    .once('did-fail-load', function (event, errorCode, errorDescription, validatedURL, isMainFrame) {
                        if (isMainFrame) {
                            var data = Array.prototype.slice.call(arguments);
                            data.push({
                                doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-fail-load'
                            });
                            events['did-fail-load'] = data;
                        }
                    })
                    .on('did-get-redirect-request', function (event, oldURL, newURL, isMainFrame) {
                        if (isMainFrame) {
                            if (!events['did-get-redirect-request']) {
                                events['did-get-redirect-request'] = [];
                            }
                            var data = Array.prototype.slice.call(arguments);
                            data.push({
                                doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-get-redirect-request'
                            });
                            events['did-get-redirect-request'].push(data);
                        }
                    })
                    // .clearCache()
                    .goto(params.url, params.headers || {})
                    .wait('body')
                    .evaluate(function (params) {

                        params = JSON.parse(params);

                        (function (ready) {

                            function trigger(status) {
                                window[params.nmsc] = window[params.nmsc] || []; window[params.nmsc].push(status);
                            };

                            if (window[params.nmsc] && window[params.nmsc].length) {
                                return ready(window[params.nmsc][0]);
                            }

                            window[params.nmsc] = {
                                push: ready
                            };

                            // log('test dog: ', params)

                            if (params.ajaxwatchdog) {

                                if (typeof params.ajaxwatchdog === 'number') {
                                    log('use ajaxwatchdog timeout');
                                    setTimeout(trigger, params.ajaxwatchdog);
                                }

                                if (typeof params.ajaxwatchdog === 'object') {
                                    log('use ajaxwatchdog counter')
                                    window.XMLHttpRequest.prototype.onAllFinished(
                                        trigger,
                                        params.ajaxwatchdog.waitafterlastajaxresponse,
                                        params.ajaxwatchdog.longestajaxrequest
                                    );
                                }

                            }
                            else {
                                log('params.ajaxwatchdog - disabled (manual mode)')
                            }

                        }(function (data) {
                            setTimeout(function () {
                                if (document.getElementById(params.readyid)) {
                                    return;
                                }
                                var end = document.createElement('div');
                                end.setAttribute('id', params.readyid);
                                document.body.appendChild(end);
                                window[params.nmsc].ajaxwatchdogresponse = data;
                            }, 50);
                        }));
                    }, JSON.stringify(params))
                    .wait('#' + params.readyid)
                    .evaluate(function (params) {

                        params = JSON.parse(params);

                        var readyid = document.getElementById(params.readyid);

                        readyid.parentNode.removeChild(readyid);

                        return {
                            html: (function () {
                                try {
                                    // https://developer.mozilla.org/en-US/docs/Web/API/Document/doctype
                                    // http://stackoverflow.com/a/10162353
                                    var node = document.doctype;
                                    var html = "<!DOCTYPE "
                                        + (node ? (
                                            node.name
                                            + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
                                            + (!node.publicId && node.systemId ? ' SYSTEM' : '')
                                            + (node.systemId ? ' "' + node.systemId + '"' : '')
                                        ) : 'nodoctype')
                                        + '>';
                                    html += document.documentElement.outerHTML;

                                    return html;
                                }
                                catch (e) {
                                    return "couldn't dump DOM html";
                                }
                            }()),
                            internalLinks: Object.assign({}, location, {
                                links: (function () {

                                    var h, links = [];

                                    var path = location.pathname.split('/');
                                    path.pop();
                                    path = path.join('/');

                                    var noorigin = location.href.substring(location.origin.length)
                                    var nooriginwithouthash = noorigin;

                                    if (noorigin.indexOf('#') > -1) {
                                        nooriginwithouthash = noorigin.split('#');
                                        nooriginwithouthash = nooriginwithouthash[0];
                                    }

                                    var list = Array.prototype.slice.call(document.getElementsByTagName('a')).map(function (a) {
                                        return a.getAttribute('href');
                                    }).filter(function (h) {

                                        if (h) {
                                            return !!h.replace(/^\s*(\S*(\s+\S+)*)\s*$/, '$1')
                                        }

                                        return false;
                                    });

                                    // http://origin/directory/link
                                    // /directory/link
                                    // directory/link
                                    // not //origin/directory/link
                                    // not #hash
                                    for (var i = 0, l = list.length ; i < l ; i += 1 ) {
                                        h = list[i];

                                        if (h === location.href || h === noorigin || h === nooriginwithouthash) {
                                            continue;
                                        }

                                        if (h[0] === '?') {
                                            links.push(location.pathname + h);
                                            continue;
                                        }

                                        if (h[0] === '#') {
                                            continue;
                                        }

                                        if (h[0] === '/') {
                                            if (h[1] && h[1] === '/') {
                                                continue;
                                            }
                                            links.push(h);
                                            continue;
                                        }

                                        if (h.indexOf(location.origin) === 0) {
                                            links.push(h.substring(location.origin.length));
                                            continue;
                                        }

                                        if (!/^https?:\/\//i.test(h) && h[0] !== '/') {
                                            links.push(path + '/' + h);
                                        }
                                    }

                                    return links;
                                }()).reverse().filter(function (e, i, arr) {
                                    return arr.indexOf(e, i+1) === -1;
                                }).reverse().sort()
                            }),
                            watchdog: window[params.nmsc].ajaxwatchdogresponse
                        }
                    }, JSON.stringify(params))
                    .end()
                    .then(function (data) {

                        data.events = events;

                        var status = events['did-get-response-details'][4];

                        try { // if page was redirected then return 301 status code
                            status = events['did-get-redirect-request'][0][4];
                        }
                        catch (e) {
                        }

                        var okMimeType = true, mime = null;
                        try {
                            // no mime type example https://cran.r-project.org/doc/manuals/NEWS.1
                            mime    = events['did-get-response-details'][7]['content-type'][0];

                            if (mime.toLowerCase().indexOf('text/html') > -1) {
                                okMimeType = true;
                            }
                            else {
                                okMimeType = false;
                            }
                        }
                        catch (e) {
                            okMimeType = true;
                        }

                        if (!okMimeType) {
                            throw "mime type '" + mime + "-'";
                        }

                        data.statusCode = status;

                        data.contentType = mime;

                        data.internalLinks.links = (function () {

                            var h, links = [];

                            var path = data.internalLinks.pathname.split('/');
                            path.pop();
                            path = path.join('/');

                            var noorigin = data.internalLinks.href.substring(data.internalLinks.origin.length)
                            var nooriginwithouthash = noorigin;

                            if (noorigin.indexOf('#') > -1) {
                                nooriginwithouthash = noorigin.split('#');
                                nooriginwithouthash = nooriginwithouthash[0];
                            }

                            var list = data.internalLinks.links.concat((function () {
                                var redirect = [];

                                if (events['did-get-redirect-request']) {
                                    redirect = redirect.concat(events['did-get-redirect-request'].map(function (r) {
                                        return r[2];
                                    }));
                                }

                                return redirect;
                            }())).filter(function (h) {

                                if (h) {
                                    return !!h.replace(/^\s*(\S*(\s+\S+)*)\s*$/, '$1')
                                }

                                return false;
                            });

                            // http://origin/directory/link
                            // /directory/link
                            // directory/link
                            // not //origin/directory/link
                            // not #hash
                            for (var i = 0, l = list.length ; i < l ; i += 1 ) {
                                h = list[i];

                                if (h === data.internalLinks.href || h === noorigin || h === nooriginwithouthash) {
                                    continue;
                                }

                                if (h[0] === '?') {
                                    links.push(data.internalLinks.pathname + h);
                                    continue;
                                }

                                if (h[0] === '#') {
                                    continue;
                                }

                                if (h[0] === '/') {
                                    if (h[1] && h[1] === '/') {
                                        continue;
                                    }
                                    links.push(h);
                                    continue;
                                }

                                if (h.indexOf(data.internalLinks.origin) === 0) {
                                    links.push(h.substring(data.internalLinks.origin.length));
                                    continue;
                                }

                                if (!/^https?:\/\//i.test(h) && h[0] !== '/') {
                                    links.push(path + '/' + h);
                                }
                            }

                            return links;
                        }()).reverse().filter(function (e, i, arr) {
                            return arr.indexOf(e, i+1) === -1;
                        }).reverse().sort();

                        if (params.returnonlyhtml) {

                            return json(status, data.html)
                        }

                        return json(status, data);
                    })
                    .catch(function () {

                        var args = Array.prototype.slice.call(arguments);

                        json(500, {
                            error: 'crawler',
                            code: 'nightmare-js-crashed-exception',
                            data: args
                        });
                    })
                ;
            }, function (e) {
                json(500, {
                    error: 'prerequest',
                    code: 'general-error-then-rejected',
                    data: e
                });
            })
            .catch(function (e) {
                json(500, {
                    error: 'prerequest',
                    code: 'general-exception',
                    data: e
                });
            });
    }
    catch (e) {
        json(500, {
            error: 'crawler',
            code: 'general-exception',
            data: e
        });
    }
});

app.use(express.static('static'));

app.all('/json', (req, res) => {

    var params = {
        timeout: 300
    }

    if (req.query.timeout > 0) {
        params = Object.assign(params, req.query);
    }

    if (req.body.timeout > 0) {
        params = Object.assign(params, req.body);
    }

    params.timeout = parseInt(params.timeout, 10);

    setTimeout(() => {

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        res.end(JSON.stringify({
            ok: true
        }));

    }, params.timeout)
});

app.get('/ajaxwrong', (req, res) => {

});

app.listen(port, () => {
    console.log('Server running 0.0.0.0:'+port)
});