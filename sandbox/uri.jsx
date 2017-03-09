'use strict';

const url       = require('url');
const path      = require('path');
const log       = require(path.resolve(__dirname, '..', 'lib', 'log.jsx'));

var u = url.parse('http://user:pass@host.com:8080/p/a/t/h?raz=dwa#test')

log.json(u);