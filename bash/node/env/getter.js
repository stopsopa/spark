
// node bash/node/env/getter.js PROTECTED_MYSQL_PASS

require('dotenv-up')({
    override    : false,
    deep        : 4,
}, false, 'react/webpack.config.js');

if (process.argv.length < 3) {

    throw new Error(`process.argv.length < 3`);
}

console.log(process.env[process.argv[2]]);