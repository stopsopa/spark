var glob      = require("glob");
var path      = require("path");
var colors    = require('colors');

function findentries(root) {
    // https://github.com/dylansmith/node-pathinfo/blob/master/index.js
    // http://php.net/manual/en/function.pathinfo.php#refsect1-function.pathinfo-examples

    var list = glob.sync(root+'/**/*.entry.{js,jsx}');

    var t, tmp = {};

    for (var i = 0, l = list.length ; i < l ; i += 1 ) {

        t = list[i];

        t = path.basename(t, path.extname(t));

        t = path.basename(t, path.extname(t));

        tmp[t] = list[i];
    }

    return tmp;
}

module.exports = {
    config: false,
    setup: function (setup) {

        if (setup && !this.config) {
            this.config = require(setup);
        }

        // var env = this.env();
        var env = process.env.WEBPACK_MODE;


        console.log('env: '.yellow + env.red + "\n");

        return env;
    },
    entry: function () {

        var root = this.con('js.entries');

        if (!root) {
            throw "First specify root path for entry";
        }

        if (Object.prototype.toString.call( root ) !== '[object Array]') {
            root = [root];
        }

        var t, i, tmp = {};

        root.forEach(function (r) {

            t = findentries(r);

            for (i in t) {

                if (tmp[i]) {
                    throw "Entry file key '"+i+"' generated from file '"+t[i]+"' already exist";
                }

                tmp[i] = t[i];
            }
        });

        return tmp;
    },
    con: function (key, from) {

        if (!from) {

            if (!this.config) {
                throw "first call utils.setup()";
            }

            from = this.config;
        }

        if (key) {

            key = key + '';

            if (key.indexOf('.') > -1) {
                var tkey, keys = key.split('.');
                try {
                    while (tkey = keys.shift()) {
                        from = this.con(tkey, from);
                    }
                }
                catch (e) {
                    throw "Can't find data under key: " + key;
                }

                return from;
            }

            if ( ! from[key]) {
                throw "Can't find data under key: " + key;
            }

            return from[key];
        }

        return from;
    }
};


