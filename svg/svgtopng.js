var Nightmare = require('nightmare');

var mkdirp = require('mkdirp');

var fs = require('fs');

var path = require('path');

var argv = require('minimist')(process.argv.slice(2));

if (!argv._.length) {
    throw "Please specify svg file to convert as an argument";
}

var svg = argv._[0];

var width = parseInt(argv.w || 400);

var height = parseInt(argv.h || 300);

var type = /^https?:\/\//i.test(svg) ? 'url' : 'file';

var backgroundColor;
if (argv.b) {
    backgroundColor = argv.b.replace(/['"]/g, '');
}

var output = argv.o;
if (!output) {
    if (type === 'file') {
        output = svg.replace(/^(.*?)\.[^\.]+$/, '$1')+'.png';
    }
    else { // file
        throw "If svg is provided by url you need to specify '-o' parameter to point where png should be write in local disk space";
    }
}

output = path.resolve(output);

mkdirp(path.dirname(output), function () {

    if (type === 'file') {
        svg = "file://"+path.resolve(svg);
    }

    var padding = argv.p || 0;
    if (padding) {
        height += (2 * padding);
        width += (2 * padding);
    }

    var win = {
        width: width < 400 ? 400 : width + 100,
        height: height < 300 ? 300 : height + 100
    };

    var index = "file://"+path.resolve(__dirname, "html"+path.sep+"index.html");

    var nightmare = Nightmare({
        show: false,
        ignoreCertificateErrors: true
        //waitTimeout: (60 * 60 * 24 * 7) * 1000 // one week
    });

    nightmare
        .goto(index)
        .viewport(win.width, win.height)
        .wait('body')
        .evaluate(function (svg, width, height, padding, backgroundColor) {

            var body = document.body;

            function close() {
                body.setAttribute('id', 'exit');
            }

            var img = document.querySelector('img');
            img.style.width  = (width - (2 * padding)) + 'px';
            img.style.height = (height - (2 * padding)) + 'px';
            img.style.margin = padding + 'px';

            body.style.maxWidth = (width + 100) + 'px';
            body.style.maxHeight = (height + 100) + 'px';

            if (backgroundColor) {
                body.style.backgroundColor = backgroundColor;
            }

            l(svg);
            l(width);
            l(height);

            img.onload = close;

            img.src = svg;

            return navigator.userAgent;

        }, svg, width, height, padding, backgroundColor)
        .wait('#exit')
        .screenshot(output, {
            x: 0,
            y: 0,
            width: width,
            height: height
        })
        .end()
        .then(function (result) {
            console.log('result', result)
        })
        .catch(function (error) {
            console.error('Nightmare error:', error);
        })
    ;
});

