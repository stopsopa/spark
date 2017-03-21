'use strict';

const url       = require('url');
const qs        = require('querystring');

const path      = require('path');
const log       = require(path.resolve(__dirname, '..', 'lib', 'log.js'));

var u = url.parse('http://user:pass@host.com:8080/p/a/t/h?raz=dwa#test')

var q = qs.parse(u.query);


log.json(u);
log.json(q);