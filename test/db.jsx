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
const moment        = require('moment');

var id = 'idhash' + (new Date()).getTime();
// var id = 'idhash1487196660236';

db.cache.insert({
    id: id,
    url: 'http://jakisurl',
    html: '<pre>pre</pre>',
    created: db.now(),
    updated: db.now()

}).then(function (newid) {
    log('inserted id: ', newid)
    db.cache.cachenew();
    setTimeout(function () {
        db.cache.update({
            url: 'http://urlchanged updated',
            html: '<pre>updated pre</pre>',
            updated: db.now()
        }, id).then(function () {

            db.cache.select().then(function (list) {
                log(list)
                log('all done...', moment().format('YYYY-MM-DD HH:mm:ss'))
                setTimeout(() => db.db.end(), 1000);
            })
        })
    }, 2000);

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