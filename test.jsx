var log       = console.log;

var Nightmare = require('nightmare');
const fs = require('fs');

var browser = new Nightmare({
    show: false,
    ignoreCertificateErrors: true
})

var file = 'google.png';

if (fs.existsSync(file)) {
    fs.unlinkSync(file);

    if (fs.existsSync(file)) {
        throw "can't delete file '"+file+"'";
    }
}

if (fs.existsSync(file)) {
    throw "file '"+file+"' shouldn't exist";
}

try {
    browser
        .goto('https://www.google.co.uk')
        .screenshot(file)
        .end() // without that, then will be executed but entire script wont stop
        .then(function (result) {

            if (!fs.existsSync(file)) {
                throw "file '"+file+"' doesn't exist, this file should be created by nightmare";
            }

            if (fs.lstatSync(file).isFile()) {
                log('result: nightmare works (file '+ file + ' exist)')
            }
            else {
                throw 'error - file '+ file + "hasn't been created";
            }
        })
        .catch(function (error) {
            console.error('Nightmare error:', error);
        })
}
catch (e) {
    log('general error: '+e)
}
