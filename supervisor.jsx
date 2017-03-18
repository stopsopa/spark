//Lets require/import the HTTP module
const http          = require('http');
const path          = require('path');
const spawn         = require('child_process').spawn;
const log           = console.log;
const assert        = console.assert;
const bodyParser    = require('body-parser');
const express       = require('express');
const app           = express();

assert(process.argv.length > 3, "try to call for example 'node " + path.basename(__filename) + " 0.0.0.0 8080'");

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

app.all('/fetch', (req, res) => {

    proc = spawn('node', ['fork.jsx', objToBase64(params)], {
        maxBuffer: 200*1024,
        timeout: params.timeout,
        killSignal: 'SIGTERM',
        shell: true
    });
});

app.use(express.static('static'));

function response(res, data, code) {

    res.statusCode = code || 200;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    res.end(JSON.stringify(data));
}

app.all('/status', (req, res) => {

    // ps aux | grep "node server.js" | grep -v grep
    proc = spawn('bash', ['status.sh'], {
        maxBuffer: 200*1024,
        timeout: 5000,
        killSignal: 'SIGTERM',
        shell: true
    });

    var buff = '';

    proc.stdout.on('data', (data) => {
        buff += `${data}`;
    });

    proc.stderr.on('data', (data) => {
        return response(res, {
            errorType: 'child process stderr',
            data: data.toString('utf-8')
        }, 500);
    });

    proc.on('close', () => {
        response(res, {
            response: buff || 'serwer is not running'
        }, (buff.indexOf('server.jsx') > -1) ? 200 : 404);
    });
});

app.all('/start', (req, res) => {

    // ps aux | grep "node server.js" | grep -v grep
    proc = spawn('bash', ['start.sh', req.body.ip, req.body.port], {
        maxBuffer: 200*1024,
        timeout: 5000,
        killSignal: 'SIGTERM',
        shell: true
    });

    response(res, {
        response: 'attempt to start'
    });
});

app.all('/stop', (req, res) => {

    // kill -SIGTERM $(ps aux | grep "server.jsx" | grep -v grep | head -1 | awk '{print $2}')
    proc = spawn('bash', ['stop.sh'], {
        maxBuffer: 200*1024,
        timeout: 5000,
        killSignal: 'SIGTERM',
        shell: true
    });

    response(res, {
        response: 'attempt to stop'
    });
})

app.listen(port, ip, () => {
    console.log('Server running '+ip+':'+port)
});