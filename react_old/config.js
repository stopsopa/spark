const path      = require("path");

const web = '../static';

module.exports = {
    roots: [ // where to search by require
        path.resolve('src'),
        // path.resolve(web + '/bundles')
    ],
    alias: {
        // 'log': path.join(__dirname, 'webpack', 'log'),
        log     : path.resolve('./webpack/log'),

        // https://facebook.github.io/react/docs/update.html g(Immutability Helpers)
        // https://www.npmjs.com/package/immutability-helper
        // https://github.com/seansfkelley/pure-render-decorator/commit/137f8a3c6999aba4688f81ad6c9f4b9f0a180de1
        // fbjs/lib/shallowEqual.js somewhere in node_modules from repository 'facebook/fbjs'
        // https://github.com/jurassix/react-immutable-render-mixin
        update  : 'immutability-helper',
        fb: 'fbjs/lib',
    },
    provide: {
        log: 'log'
    },

    js: {
        entries: [ // looks for *.entry.{js|jsx} - watch only on files *.entry.{js|jsx}
            path.resolve('./src'),
            // ...
        ],
        output: path.resolve(web + '/js')
    },
    scss: {
        entries: [ // only this scss files will be transformed to css
            path.resolve('./src/scss/**/*.scss')
            // ...
        ],
        output: path.resolve(web + '/css')
    }
}
