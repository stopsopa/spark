'use strict';

var lib = function (delay) {
    (typeof delay === 'undefined') && (delay = 100);

    return new Promise(function (resolve) {
        setTimeout(resolve, delay);
    });
};

lib.reject = function (delay) {

    (typeof delay === 'undefined') && (delay = 100);

    return new Promise(function (resolve, reject) {
        setTimeout(reject, delay);
    });
}

module.exports = lib;

