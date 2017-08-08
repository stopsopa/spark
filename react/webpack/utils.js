/**
 * @author Szymon Działowski
 * @license MIT License (c) copyright 2017-present original author or authors
 * @homepage https://github.com/stopsopa/webpack3
 */

'use strict';

var glob        = require("glob");
var path        = require("path");
var colors      = require('colors');
var fs          = require('fs');
var mkdirp      = require('mkdirp');

function json(data) {
    return JSON.stringify(data, null, '    ').replace(/\\\\/g, '\\');
}

function findentries(root) {

    const list = glob.sync(root + "/**/*.entry.{js,jsx}");

    let tmp, entries = {};

    for (let i = 0, l = list.length ; i < l ; i += 1) {

        tmp = path.parse(list[i]);

        tmp = path.basename(tmp.name, path.extname(tmp.name));

        if (entries[tmp]) {

            throw "There are two entry files with the same name: '" + path.basename(entries[tmp]) + "'"
        }

        entries[tmp] = list[i];
    }

    return entries;
}

function dirEnsure(dir, createIfNotExist) {

    if ( fs.existsSync(dir) ) {

        if ( ! fs.lstatSync(dir).isDirectory() ) {

            throw "'" + dir + "' is not directory";
        }
    }
    else {

        if (createIfNotExist) {

            try {

                mkdirp.sync(dir);

                if ( ! fs.existsSync(dir) ) {

                    throw "Directory '" + dir + "' doesn't exist, check after mkdirp.sync(" + dir + ")";
                }
            }
            catch (e) {

                throw "Can't create directory '" + dir + "', error: " + e;
            }
        }
        else {

            throw "Directory '" + dir + "' doesn't exist, (createIfNotExist = false) check";
        }
    }
}

var symlinkEnsure = (function () {
    function unique(pattern) {
        pattern || (pattern = 'file-xyxyxyxyxyxyxyxyxy.tmp');
        return pattern.replace(/[xy]/g,
            function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    }
    return function (target, dir) {

        if ( fs.existsSync(target) ) {

            if ( ! fs.lstatSync(target).isSymbolicLink() ) {

                throw "'" + target + "' is not symlink";
            }
        }
        else {

            try {

                var dirWhereToLink = path.resolve(target, '..');

                var relative = path.relative(dirWhereToLink, dir);

                process.chdir(dirWhereToLink);

                fs.symlinkSync(relative, target, 'dir');

                if ( ! fs.existsSync(target) ) {

                    throw "Symlink '" + target + "' can't be created";
                }

                process.chdir(__dirname);
            }
            catch (e) {

                throw "Symlink '" + target + "' can't be created for path '" + relative
                + "', \n\n   " + json({
                    sym                     : target,
                    dir                     : dir,
                    relative                : relative,
                    "__dirname        "     : __dirname,
                    "process.cwd() now"     : process.cwd(),
                })
                + " ', \n\n    exception error:\n    " + e;
            }
        }

        // now test to be sure

        var file = unique();

        var dirfile = path.resolve(dir, file);

        var targetfile = path.resolve(target, file);

        fs.closeSync(fs.openSync(dirfile, 'w'));

        if ( fs.existsSync(dirfile) ) {

            if ( ! fs.lstatSync(dirfile).isFile() ) {

                throw "Weird, created test file '" + dirfile + "' is not file";
            }
        }
        else {

            throw "Can't create test file '" + dirfile + "'";
        }

        if ( fs.existsSync(targetfile) ) {

            if ( ! fs.lstatSync(targetfile).isFile() ) {

                throw "Weird, created test file '" + targetfile + "' exist but is not file";
            }

            fs.unlinkSync(dirfile);

            if ( fs.existsSync(targetfile) ) {

                throw "Test file '" + targetfile + "' should be now deleted, but it still exist";
            }
        }
        else {

            throw "Test file '" + dirfile + "' has been created but is not visible on the other side of symlink '" + targetfile + "', seems like wrong symlink";
        }
    }
}());

var utils = {
    config: false,
    setup: function (setup) {

        if (setup && !this.config) {

            this.config = require(setup);
        }

        console.log('env: '.yellow + this.env.red + "\n");

        return this.env;
    },
    entries: function () {

        var t, i, tmp = {}, root = this.config.js.entries;

        if (!root) {

            throw "First specify root path for entry";
        }

        if (Object.prototype.toString.call( root ) !== '[object Array]') {

            root = [root];
        }

        root.forEach(function (r) {

            t = findentries(r);

            for (i in t) {

                if (tmp[i]) {
                    
                    throw "There are two entry files with the same name: '" + path.basename(t[i]) + "'"
                }

                tmp[i] = t[i];
            }
        });

        if (!Object.keys(tmp).length) {

            throw "Not found *.entry.js files in directories : \n" + json(root, null, '    ');
        }

        return tmp;
    },
    symlink : function (list) {

        var fsdir, dir, link, nlist = [];

        list.forEach(function (p) {

            if (typeof p === 'string') {

                nlist.push(p);
            }
            else {

                if (typeof p.link !== 'string') {

                    throw "'link' is not defined in resolve path object: \n" + json(p);
                }

                if (typeof p.path !== 'string') {

                    throw "'path' is not defined in resolve path object: \n" + json(p);
                }

                dir = path.dirname(p.link);

                try {

                    dirEnsure(dir, true);

                    dirEnsure(p.path);
                }
                catch (e) {

                    throw "dirEnsure() error on resolve object: \n" + json(p) + "\n    error:\n        " + e;
                }

                symlinkEnsure(p.link, p.path);

                nlist.push(p.link);
            }
        });

        return nlist;
    }
};

utils.env   = process.env.WEBPACK_MODE || 'dev';

utils.dev   = (utils.env === 'dev');

utils.prod  = !utils.dev;

module.exports = utils;


