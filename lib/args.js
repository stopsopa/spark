'use strict';

function isObject(a) {
    // return (!!a) && (a.constructor === Object);
    return Object.prototype.toString.call(a) === '[object Object]'; // better in node.js to dealing with RowDataPacket object
};
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

var t;

module.exports = function (a, list) {

    (typeof list === 'undefined') && (list = ['string', 'array', 'object']); // for now only 3 types available
    // other types going to last

    var tmp = {}, last = list[list.length - 1];

    list.forEach(function (v) {
        tmp[v] = [];
    });

    Array.prototype.slice.call(a).forEach(function (a) {

        t = typeof a;

        if (list.indexOf('string') > -1) {
            if (t === 'string') {
                return tmp.string.push(a);
            }
        }

        if (list.indexOf('array') > -1) {
            if (isArray(a)) {
                return tmp.array.push(a);
            }
        }

        if (list.indexOf('object') > -1) {
            if (isObject(a)) {
                return tmp.object.push(a);
            }
        }

        tmp[last].push(a);
    });

    var ret = {};

    list.forEach(function (v) {
        ret[v] = {
            shift: function () {

                var args = Array.prototype.slice.call(arguments);

                if (tmp[v].length) {
                    return tmp[v].shift();
                }

                return args[0];
            },
            pop: function () {

                var args = Array.prototype.slice.call(arguments);

                if (tmp[v].length) {
                    return tmp[v].pop();
                }

                return args[0];
            },
            all: function () {
                return tmp[v];
            }
        }
    });

    return ret;
}