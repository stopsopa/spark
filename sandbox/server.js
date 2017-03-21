// https://nodejs.org/dist/latest-v6.x/docs/api/synopsis.html

// check later:
// clear cache: https://github.com/segmentio/nightmare#custom-preload-script

// ajax
// http://stackoverflow.com/questions/5202296/add-a-hook-to-all-ajax-requests-on-a-page

const http          = require('http');
const path          = require('path');
const bodyParser    = require('body-parser');
const fs            = require('fs');
const express       = require('express');
const assert        = console.assert;
const log           = console.log;
const app           = express();
const spawn         = require('child_process').spawn;
const base64        = require('base-64');

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
    delimiter: "-{[\"'}]-"
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
function base64ToObj(base) {
    return JSON.parse(base64.decode(base));
}
function objToBase64(obj) {
    return base64.encode(JSON.stringify(obj));
}

// https://expressjs.com/en/guide/routing.html#app-route
app.all('/fetch', (req, res) => {

    var
        proc,
        handler,
        json,
        params = req.query,
        error = false,
        ret = {
            log: log
        }
    ;

    ret.json = json = function (code, data) {

        try {
            clearTimeout(handler);

            proc && proc.kill && proc.kill('SIGKILL');

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

        json = function () {};
    }

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

        proc = spawn('node', ['fork.js', objToBase64(params)], {
            maxBuffer: 200*1024,
            timeout: params.timeout,
            killSignal: 'SIGTERM',
            shell: true
        });

        if (params.timeout) {
            handler = setTimeout(() => {

                log('process killed because of timeout for url: ' + params.url);

                return json(500, {
                    errorType: 'process killed - timeout',
                    data: params
                });
            }, params.timeout + 100);
        }

        var i, tmp, buff = '', delen = params.delimiter.length;

        function cut() { // http://stackoverflow.com/a/15515651

            i = buff.indexOf(params.delimiter);

            if (i > -1) {

                tmp = buff.substr(0, i);

                buff = buff.substr(i + delen);

                try {
                    tmp = JSON.parse(tmp);
                }
                catch(e) {
                    json(500, {
                        errorType: 'data from child process - json parse error',
                        data: tmp
                    });
                }

                if (tmp.flag) {
                    ret[tmp.flag].apply(this, tmp.data);
                }
                else {
                    json(500, {
                        errorType: 'wrong data from child process',
                        data: tmp
                    })
                }
            }
        }

        proc.stdout.on('data', (data) => {

            buff += `${data}`;

            cut();
        });

        proc.stderr.on('data', (data) => {
            return json(500, {
                errorType: 'child process stderr',
                data: data.toString('utf-8')
            });
        });

        proc.on('close', cut);
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

app.listen(port, ip, () => {
    console.log('Server running '+ip+':'+port)
});
