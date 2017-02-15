'use strict';

(function () { // https://gist.github.com/branneman/8048520#6-the-hack
    // how to use: rootRequire(path.join('lib', 'db_spark.jsx'))
    if (!global.rootRequire) {

        const path          = require("path");

        const args = Array.prototype.slice.call(arguments);

        process.env.NODE_PATH = path.resolve.apply(this, args);

        global.rootRequire = function (name) {
            return require(path.resolve.apply(this, args.concat([name])));
        }
    }
}(__dirname, '..'));

const path          = require("path");
const mysql         = require('mysql');
const db            = rootRequire(path.join('lib', 'db_spark.jsx'));
const log           = rootRequire(path.join('react', 'webpack', 'log.js'));

db.cache.create({
    id: 'idhash',
    url: 'http://jakisurl',
    html: '<pre>pre</pre>'

}).then(function (id) {
    log('inserted id: ', id)
});
// db.cache.cachenew();

// connection.connect();
//
// connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
//
//     if (error) throw error;
//
//     console.log('The solution is: ', results[0].solution);
// });
//
// connection.end();