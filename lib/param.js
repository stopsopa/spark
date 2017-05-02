'use strict';

const path = require('path');

require(path.resolve(__dirname, 'rootrequire'))(__dirname, '..');
const config = rootrequire('config');

if (process.argv.length > 2) {

    let k, tmp = config, ref = process.argv[2], args = ref.split('.');

    do {
        k = args.shift();

        if (tmp[k]) {
            tmp = tmp[k];
        }
        else {
            throw "Can't find data in config under key '" + ref + "'";
        }
    } while (args.length);

    console.log(tmp);
}
