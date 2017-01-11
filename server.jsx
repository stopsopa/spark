// https://nodejs.org/dist/latest-v6.x/docs/api/synopsis.html

// później obczaić:
// clear cache: https://github.com/segmentio/nightmare#custom-preload-script

// ajax
// http://stackoverflow.com/questions/5202296/add-a-hook-to-all-ajax-requests-on-a-page

const Nightmare     = require('nightmare');
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
    loadTimeout: 35000, // 10 sec [powinien być dłuższy czas niż gotoTimeout inaczej exception from gotoTimeout będzie zduszony]

    waitTimeout: 30000, // 20 sec [This will throw an exception if the .wait() didn't return true within the set timeframe.]
    pollInterval: 60, // How long to wait between checks for the .wait() condition to be successful.
    executionTimeout: 30000, // 10 sec [The maxiumum amount of time to wait for an .evaluate() statement to complete.]
    'ignore-certificate-errors': true,
    show: true,
    dock: true,
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


        // return json(500, params)

        // const proc = spawn('ls', ['-la'], {
        //     timeout: params.timeout
        // });
        //
        // proc.stdout.on('data', (data) => {
        //
        //     var obj = data.toString('ascii');
        //
        //     return log(obj);
        //
        //     if (obj.flag === 'exit') {
        //         clearTimeout(handler);
        //     }
        //
        //     ret[obj.flag].apply(this, obj.data);
        // });

        // return log(objToBase64({raz: 'dwa'})) // eyJyYXoiOiJkd2EifQ==

                    // const proc = spawn('node', ['fork.jsx', 'eyJyYXoiOiJkd2EifQ==']);
                    //
                    // proc.stdout.on('data', (data) => {
                    //
                    //     var obj = base64ToObj(data.toString('ascii'));
                    //
                    //     log(obj);
                    // });
                    //
                    // var handler;
                    //
                    // if (params.timeout) {
                    //     handler = setTimeout(() => {
                    //
                    //         proc.kill('SIGKILL');
                    //
                    //         log('process killed - timeout for url: ' + params.timeout);
                    //
                    //         return json(500, {
                    //             errorType: 'process killed - timeout',
                    //             data: params
                    //         });
                    //     }, 3000);
                    // }
                    //
                    // return log('extyi');

        // return log(`node fork.jsx ` + objToBase64(params) + ' plain');

        // simple.html
        // node fork.jsx eyJoZWFkZXJzIjp7fSwibm1zYyI6Im5tc2MiLCJyZXR1cm5vbmx5aHRtbCI6ZmFsc2UsImFqYXh3YXRjaGRvZyI6eyJ3YWl0YWZ0ZXJsYXN0YWpheHJlc3BvbnNlIjoxMDAwLCJsb25nZXN0YWpheHJlcXVlc3QiOjUwMDB9LCJ0aW1lb3V0IjoxNTAwMCwidXJsIjoiaHR0cDovL2h0dHBkLnBsL3NpbXBsZS5odG1sIiwibmlnaHRtYXJlIjp7ImdvdG9UaW1lb3V0Ijo0MDAwLCJ3YWl0VGltZW91dCI6NDAwMCwicG9sbEludGVydmFsIjo2MCwiZXhlY3V0aW9uVGltZW91dCI6NDAwMCwibG9hZFRpbWVvdXQiOjYwMDAsImlnbm9yZS1jZXJ0aWZpY2F0ZS1lcnJvcnMiOnRydWUsInNob3ciOnRydWUsImRvY2siOnRydWUsImFsd2F5c09uVG9wIjpmYWxzZSwid2ViUHJlZmVyZW5jZXMiOnsicHJlbG9hZCI6Ii9Wb2x1bWVzL3RjL3ZhZ3JhbnQvc3BhcmsvcnVudGltZS9wdWJsaWNfaHRtbC9zdGF0aWMvbGlicy9vbkFsbEZpbmlzaGVkLmpzIn19LCJyZWFkeWlkIjoicmVhZHlpZF8xNDg0MDgzODExODE2In0= plain

        // ajax.html
        // node fork.jsx eyJoZWFkZXJzIjp7fSwibm1zYyI6Im5tc2MiLCJyZXR1cm5vbmx5aHRtbCI6dHJ1ZSwiYWpheHdhdGNoZG9nIjp7IndhaXRhZnRlcmxhc3RhamF4cmVzcG9uc2UiOjEwMDAsImxvbmdlc3RhamF4cmVxdWVzdCI6NTAwMH0sInRpbWVvdXQiOjE1MDAwLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0L2FqYXguaHRtbCIsIm5pZ2h0bWFyZSI6eyJnb3RvVGltZW91dCI6NDAwMCwid2FpdFRpbWVvdXQiOjQwMDAsInBvbGxJbnRlcnZhbCI6NjAsImV4ZWN1dGlvblRpbWVvdXQiOjQwMDAsImxvYWRUaW1lb3V0Ijo2MDAwLCJpZ25vcmUtY2VydGlmaWNhdGUtZXJyb3JzIjp0cnVlLCJzaG93Ijp0cnVlLCJkb2NrIjp0cnVlLCJhbHdheXNPblRvcCI6ZmFsc2UsIndlYlByZWZlcmVuY2VzIjp7InByZWxvYWQiOiIvVm9sdW1lcy90Yy92YWdyYW50L3NwYXJrL3J1bnRpbWUvcHVibGljX2h0bWwvc3RhdGljL2xpYnMvb25BbGxGaW5pc2hlZC5qcyJ9fSwicmVhZHlpZCI6InJlYWR5aWRfMTQ4NDA4NDU3MTM4OCJ9 plain

        proc = spawn('node', ['fork.jsx', objToBase64(params)], {
            maxBuffer: 200*1024,
            timeout: params.timeout,
            killSignal: 'SIGTERM',
            shell: true
        });

        // if (params.timeout) {
        //     handler = setTimeout(() => {
        //
        //         log('process killed - timeout for url: ' + params.timeout);
        //
        //         return json(500, {
        //             errorType: 'process killed - timeout',
        //             data: params
        //         });
        //     }, params.timeout + 100);
        // }

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

        proc.on('close', (code) => {

            cut();

            // return json(500, {
            //     errorType: 'child process closed',
            //     data: params
            // });
        });
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
