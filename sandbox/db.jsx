'use strict';

require(path.resolve(__dirname, 'lib', 'rootrequire.jsx'))(__dirname, '..');

const path          = require("path");
const mysql         = require('mysql');
const db            = rootrequire(path.join('lib', 'db_spark.jsx'));
const log           = rootrequire(path.join('react', 'webpack', 'log.js'));
const moment        = require('moment');

var id = 'idhash' + (new Date()).getTime();
// var id = 'idhash1487196660236';

// db.cache.query("select * from spark_cache where id in (:id) or id = :dwa", {id: ['idhash1487540603903', 'idhash'], dwa: 'idhash1487540568037'})
// .then(function (res) {
//     log(res)
// }, function (rej) {
//     log('rej', rej)
// })

// db.cache.insert({
//     id: id,
//     url: 'http://jakisurl a - ',
//     html: '<pre>pre</pre>',
//     created: db.now(),
//     updated: db.now()
// });

// var res = db.cache.update({
//     id: id,
//     url: 'http://jakisurl a b c d e f',
//     html: '<pre>pre</pre>',
//     created: db.now(),
//     updated: db.now()
// }, 'idhash1487539402356').then(function (res) {
//     log(res)
// });
//
// db.cache.count({
//     url: 'http://urlchanged updated'
// }).then(function (count) {
//     log('count: ', count)
// })

var run = () => {
    db.cache.query('select id from spark_cache where id = :id and url = :url limit 1', {url: 'tes url', id: 'idhash1487193756653'})
    .then(function (response) {
        log( ((new Date()).getTime())+ ' response: ', response)
    }, function () {
        log( ((new Date()).getTime())+ ' fail: ', arguments)
    })
};
run();

setInterval(run, 4000);

// db.cache.insert({
//     id: id,
//     url: 'http://jakisurl',
//     html: '<pre>pre</pre>',
//     created: db.now(),
//     updated: db.now()
//
// }).then(function (newid) {
//     log('inserted id: ', newid)
//     db.cache.cachenew();
//     setTimeout(function () {
//         db.cache.update({
//             url: 'http://urlchanged updated',
//             html: '<pre>updated pre</pre>',
//             updated: db.now()
//         }, id).then(function () {
//
//             db.cache.select().then(function (list) {
//                 log(list)
//                 log('all done...', moment().format('YYYY-MM-DD HH:mm:ss'))
//                 setTimeout(() => db.db.end(), 1000);
//             })
//         })
//     }, 2000);
//
// });
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