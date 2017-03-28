'use strict';

const sha1              = require('sha1');

function hash(url) {

    // console.log('before', url);
    if ( /^https?:\/\/.+/.test(url) ) {
        url = url.replace(/^https?:\/\/[^\/]+(.*)$/i, '$1');
        console.log('after', url);
    }

    // if (/^https?:\/\//i.test(url)) {
    //     url = url.replace(/^https?:\/\/[^\/\?\#&=]+(.*)$/i, '$1');
    // }

    return sha1(url);
};

// from now on hash from entire url
hash = sha1;

module.exports = hash;

(function () {

    // g(Accessing the main module)
    // http://stackoverflow.com/a/6398335
    if (require.main === module) {

        var arg = process.argv[2];

        if (!arg) {
            return console.log('call: ' + (process.argv.join(' ')) + ' [http://url_to_hash]');
        }

        console.log(JSON.stringify({url: arg, hash: hash(arg)}, null, '    '));
    }
}());
