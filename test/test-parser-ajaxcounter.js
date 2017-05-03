'use strict';

const assert        = require('assert');
const path          = require('path');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire'))(__dirname, '..');

const config        = rootrequire('test', 'config');
const log           = rootrequire('lib', 'log');
const json          = rootrequire('test', 'lib', 'json');

// http://xxx.xxx.xxx.xxx:1025/test/links.html#empty-href
describe('parser - onAllFinished event', () => {

    it('test - all', function () {

    });
});