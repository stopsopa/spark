//Lets require/import the HTTP module
const http          = require('http');
const path          = require('path');
const Nightmare     = require('nightmare');
const log           = console.log;
const assert        = console.assert;
const bodyParser    = require('body-parser');
const express       = require('express');
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


const defopt = {
    // width: 1366,
    // height: 768,
    // nightmare: {
    //     gotoTimeout: 20000, // 20 sec
    //     waitTimeout: 20000, // 20 sec
    //     executionTimeout: 10000, // 10 sec
    // },
    headers : {},
    // readyid: 'readyid', // don't change anything, you just can use predefined id instead of random
    nmsc: 'nmsc', // just namespace [nightmare scraper] window.nmsc = window.nmsc || []; nmsc.push(true);

    // readyselector : 'body #UH-0-Header',
    // readyselector : '[class="text-lowercase ng-binding"]', // first priority
    returnonlyhtml: false,
    ajaxwatchdog: {
        waitafterlastajaxresponse: 1000, // 1 sec
        longestajaxrequest: 5000 // 5 sec
    }, // second priority (only if readyselector is not specified) - enabled by default
    timeout: 36000, // general fork process timeout
};

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
        preload: path.resolve('static', 'libs', "onAllFinished.js") // (custom preload script preload.js) https://github.com/segmentio/nightmare#custom-preload-script
        //alternative: preload: "absolute/path/to/custom-script.js"
    }
};

app.all('/fetch', (req, res) => {

    var
        id = 'readyid_' + (new Date()).getTime(),
        params = req.query,
        error = false
    ;

    try {

        if (req.method === 'POST') { // http://expressjs.com/en/api.html#req

            // interesting failure: req.body is not object when urlencoded post ???
            // log('post: ', req.body, req.method, isObject(req.body), typeof req.body, req.body.constructor);
            Object.assign(params, req.body);
        }

        params = Object.assign({}, defopt, params);

        params.nightmare = Object.assign(params.nightmare || {}, nightmaredef);

        if (!params.url) {
            error = "specify 'url' param (in get or post or json method)";
        }

        if (error) {
            return json(404, error);
        }

        if (!params.readyid) {
            params.readyid = 'readyid_' + (new Date()).getTime();
        }

        if (typeof params.returnonlyhtml === 'string') {
            params.returnonlyhtml = (params.returnonlyhtml.toLowerCase() === 'true') ? true : false;
        }

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

                    res.end(JSON.stringify(data));

                }
                catch (e) {
                    log('express error: ', e)
                }

                stop = true;
            }
        }());

        var night = Nightmare(params.nightmare);

        var collect = {};

        night
            .on('console', function () {
                var args = Array.prototype.slice.call(arguments);

                args[0] = '[browser:'+args[0]+']';

                log.apply(this, args);
            })
            .on('page', function (type) {

                var args = Array.prototype.slice.call(arguments);

                switch(type) {
                    case 'error':
                        return json.apply([500, {
                            errorType: 'page event error',
                            data: args
                        }]);
                    case 'alert':
                    case 'prompt':
                    case 'confirm':
                        args[0] = "[browser:"+args[0]+"]";

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
                collect['did-get-response-details'] = data;
            })
            .once('did-fail-load', function (event, errorCode, errorDescription, validatedURL, isMainFrame) {
                if (isMainFrame) {
                    var data = Array.prototype.slice.call(arguments);
                    data.push({
                        doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-fail-load'
                    });
                    collect['did-fail-load'] = data;
                }
            })
            .on('did-get-redirect-request', function (event, oldURL, newURL, isMainFrame) {
                if (isMainFrame) {
                    if (!collect['did-get-redirect-request']) {
                        collect['did-get-redirect-request'] = [];
                    }
                    var data = Array.prototype.slice.call(arguments);
                    data.push({
                        doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-get-redirect-request'
                    });
                    collect['did-get-redirect-request'].push(data);
                }
            })
            .goto(params.url, params.headers || {})
            .wait('body')
            .evaluate(function (id, params) {

                params = JSON.parse(params);

                (function (ready) {

                    if (window['nmsc'] && window['nmsc'].length) {
                        return ready(window['nmsc'][0]);
                    }

                    window['nmsc'] = {
                        push: ready
                    };

                    window.XMLHttpRequest.prototype.onAllFinished(function (status) {
                        window['nmsc'] = window['nmsc'] || []; window['nmsc'].push(status);
                    }, params.ajaxwatchdog.waitafterlastajaxresponse, params.ajaxwatchdog.longestajaxrequest);

                }(function (data) {
                    setTimeout(function () {
                        if (document.getElementById(id)) {
                            return;
                        }
                        var end = document.createElement('div');
                        end.setAttribute('id', id);
                        document.body.appendChild(end);
                        window['nmsc'].ajaxwatchdogresponse = data;
                    }, 50);
                }));
            }, id, JSON.stringify(params))
            .wait('#' + id)
            .evaluate(function (id) {
                var readyid = document.getElementById(id);
                readyid.parentNode.removeChild(readyid);
                return {
                    html: (function () {
                        // https://developer.mozilla.org/en-US/docs/Web/API/Document/doctype
                        // http://stackoverflow.com/a/10162353
                        var node = document.doctype;
                        var html = "<!DOCTYPE "
                            + node.name
                            + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
                            + (!node.publicId && node.systemId ? ' SYSTEM' : '')
                            + (node.systemId ? ' "' + node.systemId + '"' : '')
                            + '>';
                        html += document.documentElement.outerHTML

                        return html;
                    }()),
                    watchdog: window['nmsc'].ajaxwatchdogresponse
                }
            }, id)
            .end()
            .then(function (data) {

                data.collect = collect;

                if (params.returnonlyhtml) {

                    return json(collect['did-get-response-details'][4], data.html)
                }

                return json(collect['did-get-response-details'][4], data);
            })
            .catch(function () {

                var args = Array.prototype.slice.call(arguments);

                json(500, {
                    errorType: 'Nightmare crashed - exception',
                    details: args
                });
            })
        ;

    }
    catch (e) {
        json(500, {
            errorType: 'parent process general exception',
            data: e
        });
    }

});

app.use(express.static('static'))

app.get('/json', (req, res) => {

    setTimeout(() => {

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        res.end(JSON.stringify({
            ok: true
        }));

    }, 300)
})

app.get('/ajaxwrong', (req, res) => {

});

app.listen(port, () => {
    console.log('Server running 0.0.0.0:'+port)
});