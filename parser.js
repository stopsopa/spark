'use strict';

const path              = require('path');
const bodyParser        = require('body-parser');
const http              = require('http');
const express           = require('express');
const url               = require('url');
const Nightmare         = require('nightmare');
const assert            = console.assert;

require(path.resolve(__dirname, 'lib', 'rootrequire'))(__dirname, '.');

const log               = rootrequire('lib', 'log');

const app               = express();

assert(process.argv.length > 3, "try to call for example 'node " + path.basename(__filename) + " 0.0.0.0 80'");

const ip                = process.argv[2];

// http://www.w3resource.com/javascript/form/ip-address-validation.php
assert(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip),
    "first argument should have format of ip address eg: 127.168.10.105 and is '" + ip + "'"
);

const port = process.argv[3];

assert(port >= 0 && port <= 65535, "port beyond range 0 - 65535 : '" + port + "'");

app.use(bodyParser.urlencoded({extended: false}));

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
        //   window.nmsc = window.nmsc || []; nmsc.push(true);
        waitafterlastajaxresponse: 1000,
        longestajaxrequest: 5000,
        debug: true, // more console.log logs
        flag: '-parser-'
    },

    headers: {},
    // readyid: 'readyid', // don't change anything, you just can use predefined id instead of random
    nmsc: 'nmsc', // if setup for "mynamespace" then triggering manually looks like
    // window.mynamespace = window.mynamespace || []; mynamespace.push(true);
    // so this is namespace where spark deploys all its tools in browser
    returnonlyhtml: false, // false - return json rich response, true - return only html as a text

    firstrequesttype: 'get', // 'head' or in some rare circumstances 'get' ('get' - worse performance)
    firstrequestheaders: {
        'User-Agent': 'Electron/version',
        Connection: 'close'
    },
    servercacheprotection: '_-_prerender_-_'
};

// http://stackoverflow.com/a/16608045/5560682
function isObject(a) {
    return (!!a) && (a.constructor === Object);
};
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

function unique(pattern) {
    pattern || (pattern = 'xyx');
    return pattern.replace(/[xy]/g,
        function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

function curl(uri, method, headers) {

    uri = url.parse(uri);

    var options = {
        method: method,
        host: uri.hostname,
        port: uri.port,
        path: uri.path,
        headers: Object.assign({}, headers || {}, {
            Host: uri.hostname
        })
    };

    return new Promise(function (resolve, reject) {

        var req = http.request(options, function (res) {

            res.setEncoding('utf8');

            resolve(res);
        });

        req.on('error', function (e) {
            reject(e)
        });

        req.end();
    });
}

app.use(express.static('static'));

app.all('/fetch', (req, res) => {

    var
        params = req.query,
        error = false
    ;

    var json = (function () {

        var stop = false;

        return function (code, data) {

            if (stop) {
                return;
            }

            stop = true;

            try {

                res.setHeader('Content-Type', 'application/json; charset=utf-8');

                res.statusCode = code;

                if (typeof data === 'string') {

                    return res.end(data);
                }

                data.statusCode = code;

                res.end(JSON.stringify(data, null, '    '));

            }
            catch (e) {
                log('express error: ', e)
            }
        }
    }());

    try {

        if (req.method === 'POST' && isObject(req.body)) { // http://expressjs.com/en/api.html#req

            // interesting failure: req.body is not object when urlencoded post ???
            // log('post: ', req.body, req.method, isObject(req.body), typeof req.body, req.body.constructor);
            Object.assign(params, req.body);
        }

        params = Object.assign({}, defopt, params);

        params.defopt = Object.assign({}, defopt);

        params.u = unique();

        params.nightmare = Object.assign({}, nightmaredef, params.nightmare || {});

        if (!params.nmsc) {
            params.nmsc = 'nmsc';
        }

        if (!params.url) {
            error = "provide 'url' as http get, post or json param";
        }

        if (!/^https?:\/\//i.test(params.url)) {
            error = "provide absolute path that starts from http[s]://...";
        }

        if (!params.url) {
            return json(500, {
                error: 'parser',
                code: 'wrong-input-parameters',
                data: {
                    method: req.method,
                    headers: req.headers
                }
            });
        }

        if (error) {
            return json(500, {
                error: 'parser',
                code: 'wrong-input-parameters',
                data: error
            });
        }

        if (!params.readyid) {
            params.readyid = 'readyid_' + unique();
        }

        log('[browser:' + params.u + ':init]: ' + params.url);

        // hardcoded for now
        // params.ajaxwatchdog = 8000;
        var prerender = (function (url, t) {
            t = url.split("#");
            t[0] = t[0] + ( (url.indexOf('?') > -1) ? '&' : '?' ) + params.servercacheprotection;
            return t.join("#");
        }(params.url));

        curl(prerender, params.firstrequesttype, params.firstrequestheaders)
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
                    mime = res.headers['content-type'];

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

                    return json(500, {
                        error: 'prerequest',
                        code: 'wrong-mime-type',
                        data: {
                            status: res.statusCode,
                            headers: res.headers
                        }
                    });
                }

                var night = Nightmare(params.nightmare);

                var events = {};

                night
                    .on('console', function () {

                        var args = Array.prototype.slice.call(arguments);

                        var type = args[0];

                        args[0] = '[browser:' + params.u + ':' + type + ']';

                        if (!events.console) {
                            events.console = {};
                        }

                        if (!events.console[type]) {
                            events.console[type] = [];
                        }

                        events.console[type].push(args);
                    })
                    .on('page', function (type) {

                        var args = Array.prototype.slice.call(arguments);

                        if (type === 'error') {
                            type = 'exception';
                        }

                        if (!events.console) {
                            events.console = {};
                        }

                        if (!events.console[type]) {
                            events.console[type] = [];
                        }

                        events.console[type].push(args);

                        switch (type) {
                            case 'error':
                                return log.apply(this, args);
                                break;
                            case 'alert':
                            case 'prompt':
                            case 'confirm':
                                args[0] = '[browser:' + params.u + ':' + args[0] + ':type:' + type + ']';
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

                        try {
                            if (isObject(events['did-get-response-details'][7])) {
                                events['did-get-response-details'][7] = (function (data) {
                                    var tmp = {};
                                    for (var k in data) {
                                        if (data.hasOwnProperty(k) && k && isArray(data[k]) && data[k][0]) {
                                            tmp[k] = data[k][0];
                                        }
                                    }
                                    return tmp;
                                }(events['did-get-response-details'][7]));
                            }
                        }
                        catch (e) {
                            log.dump(e);
                        }
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
                    .goto(prerender, params.headers || {})
                    .wait('body')
                    .evaluate(function (params) {

                        params = JSON.parse(params);

                        (function (ready) {

                            function trigger(status) {
                                window[params.nmsc] = window[params.nmsc] || [];
                                window[params.nmsc].push(status);
                            };

                            if (window[params.nmsc] && window[params.nmsc].length) {
                                return ready(window[params.nmsc][0]);
                            }

                            window[params.nmsc] = {
                                push: ready
                            };

                            if (params.ajaxwatchdog) {

                                if (typeof params.ajaxwatchdog === 'number') {
                                    log('use ajaxwatchdog timeout');
                                    setTimeout(trigger, params.ajaxwatchdog);
                                }

                                if (typeof params.ajaxwatchdog === 'object') {
                                    log('use ajaxwatchdog counter', params.ajaxwatchdog);
                                    window.XMLHttpRequest.prototype.onAllFinished(
                                        params.ajaxwatchdog.waitafterlastajaxresponse || params.defopt.ajaxwatchdog.waitafterlastajaxresponse,
                                        params.ajaxwatchdog.longestajaxrequest || params.defopt.ajaxwatchdog.longestajaxrequest,
                                        typeof params.ajaxwatchdog.debug === 'boolean' ? params.ajaxwatchdog.debug : params.defopt.ajaxwatchdog.debug,
                                        typeof params.ajaxwatchdog.flag === 'boolean' ? params.ajaxwatchdog.flag : params.defopt.ajaxwatchdog.flag
                                    ).then(trigger);
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

                                    var list = Array.prototype.slice.call(document.querySelectorAll('a[href]')).map(function (a) {
                                        return a.getAttribute('href');
                                    });

                                    // http://origin/directory/link
                                    // /directory/link
                                    // directory/link
                                    // not //origin/directory/link
                                    // not #hash
                                    for (var i = 0, l = list.length; i < l; i += 1) {

                                        h = list[i];

                                        if (h === '') {
                                            links.push('');
                                            continue;
                                        }

                                        if (/^(javascript|file|mailto):/.test(h)) {
                                            continue;
                                        }

                                        if (h[0] === '?') {
                                            links.push(location.pathname + h);
                                            continue;
                                        }

                                        if (h[0] === '#') {
                                            links.push(location.pathname + h);
                                            continue;
                                        }

                                        if (h[0] === '/') {
                                            if (h[1] && h[1] === '/') {
                                                // @todo i think i should do here replce //domain.com -> https?://domain.com and then run all logic
                                                h = location.protocol + h;
                                            }
                                            else {
                                                links.push(h);
                                                continue;
                                            }
                                        }

                                        if (h.indexOf(location.origin) === 0) {

                                            h = h.substring(location.origin.length);

                                            if (!h.length || h[0] === '/') {
                                                links.push(h);
                                            }

                                            continue;
                                        }

                                        if (!/^https?:\/\//i.test(h) && h[0] !== '/') {
                                            links.push(path + '/' + h);
                                        }
                                    }

                                    return links;
                                }()).reverse().filter(function (e, i, arr) {
                                    return arr.indexOf(e, i + 1) === -1;
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
                            // mime = events['did-get-response-details'][7]['content-type'][0];
                            mime = events['did-get-response-details'][7]['content-type'];

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

                        var fix = (function (reg, l) {

                            function preg_quote (str, delimiter) {
                                return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
                            }

                            if (params.servercacheprotection) {
                                reg = new RegExp('[\?&]' + preg_quote(params.servercacheprotection) + '&?', 'g');
                                return function (t) {
                                    t = t.split('#');
                                    t[0] = t[0].replace(reg, function (t) {
                                        l = t[t.length -1];
                                        return (l === '&' && t[0] === '?') ? '?' : '';
                                    });
                                    return t.join('#');
                                }
                            }
                            else {
                                return function (t) {return t};
                            }
                        }());

                        data.statusCode             = status;

                        data.contentType            = mime;

                        data.internalLinks.href     = fix(data.internalLinks.href);

                        data.internalLinks.search   = fix(data.internalLinks.search);

                        data.internalLinks.links = (function () {

                            var h, links = [];

                            var path = data.internalLinks.pathname.split('/');
                            path.pop();
                            path = path.join('/');

                            var list = data.internalLinks.links.concat((function () {
                                var redirect = [];

                                if (events['did-get-redirect-request']) {
                                    redirect = redirect.concat(events['did-get-redirect-request'].map(function (r) {
                                        return r[2];
                                    }));
                                }

                                return redirect;
                            }()));

                            // http://origin/directory/link
                            // /directory/link
                            // directory/link
                            // not //origin/directory/link
                            // not #hash
                            for (var i = 0, l = list.length; i < l; i += 1) {

                                h = list[i];

                                if (h === '') {
                                    links.push('');
                                    continue;
                                }

                                if (/^(javascript|file|mailto):/.test(h)) {
                                    continue;
                                }

                                if (h[0] === '?') {
                                    links.push(data.internalLinks.pathname + h);
                                    continue;
                                }

                                if (h[0] === '#') {
                                    links.push(data.internalLinks.pathname + h);
                                    continue;
                                }

                                if (h[0] === '/') {
                                    if (h[1] && h[1] === '/') {
                                        // @todo i think i should do here replce //domain.com -> https?://domain.com and then run all logic
                                        h = location.protocol + h;
                                    }
                                    else {
                                        links.push(h);
                                        continue;
                                    }
                                }

                                if (h.indexOf(data.internalLinks.origin) === 0) {

                                    h = h.substring(data.internalLinks.origin.length);

                                    if (!h.length || h[0] === '/') {
                                        links.push(h);
                                    }

                                    continue;
                                }

                                if (!/^https?:\/\//i.test(h) && h[0] !== '/') {
                                    links.push(path + '/' + h);
                                }
                            }

                            return links;
                        }()).reverse().filter(function (e, i, arr) {
                            return arr.indexOf(e, i + 1) === -1;
                        }).reverse().map(fix).sort();

                        data.html = fix(data.html);

                        if (params.returnonlyhtml) {

                            return json(status, data.html)
                        }

                        return json(status, data);
                    }, function () {

                        var args = Array.prototype.slice.call(arguments);

                        json(500, {
                            error: 'parser',
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
            });
    }
    catch (ee) {
        json(500, {
            error: 'parser',
            code: 'general-exception',
            data: ee
        });
    }
});

app.listen(port, ip, () => {
    console.log('Parser server is running ' + ip + ':' + port)
});