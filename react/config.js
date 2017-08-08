/**
 * @author Szymon Działowski
 * @license MIT License (c) copyright 2017-present original author or authors
 * @homepage https://github.com/stopsopa/webpack3
 */

'use strict';

const path              = require("path");

const root              = path.resolve(__dirname, '..');

// relative path to public server directory
const web               = path.resolve(root, 'static');

const asset            = path.resolve(web, 'asset');

const node_modules      = path.join(__dirname, 'node_modules');

module.exports = {
    web: web,
    resolve: [ // where to search by require and files to watch

        // all custom libraries
        asset,

        { // node_modules exposed on web - symlink mode
            path: node_modules,
            link: path.resolve(asset, 'public')
        },
    ],
    asset: [ // just create links, this links are not direct paths for resolver
        {
            path: path.resolve(root, 'app', 'pages'),
            link: path.resolve(asset, 'pages')
        }
    ],
    alias: {
        log: path.resolve(__dirname, 'webpack', 'logw'),
    },
    provide: { // see format: https://webpack.js.org/plugins/provide-plugin/
        log: 'log'
    },
    js: {
        entries: [ // looks for *.entry.{js|jsx} - watch only on files *.entry.{js|jsx}
            path.resolve(root, 'app'),
            // ...
        ],
        output: path.resolve(web, 'dist'),
    }
}
