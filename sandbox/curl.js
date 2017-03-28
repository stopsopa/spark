//Lets require/import the HTTP module
const http          = require('http');
const path          = require('path');
const Nightmare     = require('nightmare');
const log           = console.log;
const assert        = console.assert;
const bodyParser    = require('body-parser');
const express       = require('express');
const app           = express();

console.json = function (data) {
    data = JSON.stringify(data, null, '  ').split(/\n/g);

    for (var i = 0, l = data.length ; i < l ; i += 1 ) {
        console.log(data[i]);
    }
}

var options = {
    host: 'localhost',
    port: 80,
    path: '/fetch',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache'
    }
};

var json = {
    "url": "http://www.lymphomahub.pharmawork.com/headers.php?test",
    "returnonlyhtml": false,
    "ajaxwatchdog": {
        "waitafterlastajaxresponse":1000,
        "longestajaxrequest":5000
    }
};

var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');

    var data = '';
    res.on('data', function (chunk) {
        data += chunk;
    });
    res.on('end', function () {
        console.log('BODY: ');

        data = JSON.parse(data);

        data.html = data.html.substring(data.html.indexOf('<body>') + 6, data.html.indexOf('</body>'));

        data.html = JSON.parse(data.html);

        data = JSON.stringify(data, null, '  ').split(/\n/g);

        for (var i = 0, l = data.length ; i < l ; i += 1 ) {
            console.log(data[i]);
        }
    });


});

req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
});

// write data to request body
req.write(JSON.stringify(json, null, '  '));

req.end();