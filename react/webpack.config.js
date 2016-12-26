const path      = require("path");
const webpack   = require('webpack');
const glob      = require("glob");
const utils     = require("./webpack/utils");
const param     = require('jquery-param');

var CommonsChunkPlugin = require("./node_modules/webpack/lib/optimize/CommonsChunkPlugin");
// var ExtractTextPlugin = require("extract-text-webpack-plugin");

var env = utils.setup(path.resolve('./config.js'));

var alias = utils.con('alias');

if (env === 'prod') {
    alias['react']      = 'react-lite';
    alias['react-dom']  = 'react-lite';
}

module.exports = {
    entry: utils.entry(),
    // entry: {
    //     pageA: path.join(__dirname, ".", "src", "pageA.entry.js"),
    //     pageB: path.join(__dirname, ".", "src", "pageB.entry.jsx")
    // },
    output: {
        path: utils.con('js.output'),
        filename: "[name].bundle.js",
        publicPath: "/publicPath/"
        // chunkFilename: "[id].chunk.js",
        // sourceMapFilename: "[file].map"
    },
    plugins: [
        new CommonsChunkPlugin({
            filename: "commons.bundle.js",
            name: "commons.bundle",
            minChunks: 2
        }),
        // https://webpack.github.io/docs/list-of-plugins.html#provideplugin
        new webpack.ProvidePlugin(utils.con('provide')),
        // new webpack.SourceMapDevToolPlugin({
        //     filename: '[file].map',
        //     // exclude: ['vendors.js']
        // }),
        // new webpack.HotModuleReplacementPlugin()
    ].concat( (env === 'prod') ? [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false,
            },
            output: {
                comments: false,
            },
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        })
    ] : []),
    resolveLoader: {
        modulesDirectories: [
            "web_loaders", "web_modules", "node_loaders", "node_modules",

            // Module not found: Error: Cannot resolve module 'babel' in D:\www\_machine\webpack\runtime\public_html\bundles\react
            path.resolve('./node_modules')
        ],
        // extensions: ["", ".webpack-loader.js", ".web-loader.js", ".loader.js", ".js"],
        // packageMains: ["webpackLoader", "webLoader", "loader", "main"]
    },
    resolve: {
        extensions: ['', '.js', '.jsx'],
        // Module not found: Error: Cannot resolve module 'example/example' in /Volumes/tc/vagrant/webpack/runtime/react/src
        root: utils.con('roots'),
        modulesDirectories: [
            // Module not found: Error: Cannot resolve module 'react' in D:\www\_machine\webpack\runtime\public_html\bundles\react
            path.resolve('./node_modules')
        ],
        // alias: {
        //     'log': path.join(__dirname, 'webpack', 'log'),
        //     // 'mixins': __dirname + '/src/mixins',
        //     // 'components': __dirname + '/src/components/',
        //     // 'stores': __dirname + '/src/stores/',
        //     // 'actions': __dirname + '/src/actions/'
        // }
        alias: alias
    },
    // externals: {
    //     'prismjs': 'Prism',
    //     'react': 'React',
    //     'react-dom': 'ReactDOM'
    // },
    cache: true,
    debug: true,
    stats: {
        colors: true,
        reasons: true
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: "style!css?importLoaders=1"
            },
            {
                test: /\.scss$/,
                loader: "style!css?importLoaders=1&sourceMap!sass?errLogToConsole=true&outputStyle=compressed&sourceMap"
            },
            {
                test: /\.jsx$/,
                loader: 'babel',
                query: {
                    plugins: [
                        require.resolve('babel-plugin-transform-decorators-legacy'),
                    ],
                    presets: [
                        // Module build failed: Error: Couldn't find preset "es2015" relative to directory "D:\\www\\_machine\\webpack\\runtime\\public_html\\bundles\\react"
                        path.resolve('./node_modules/babel-preset-es2015'),
                        path.resolve('./node_modules/babel-preset-react'),
                        path.resolve('./node_modules/babel-preset-stage-0'),
                        // 'es2015',
                        // 'react'
                    ]
                },
                // include: [
                //     path.resolve(__dirname, '.'),
                //     path.resolve(__dirname, 'node_modules'),
                //     // __dirname
                // ],
                exclude: [
                    path.join(__dirname, 'node_modules'),
                //     // path.join(__dirname, 'js')
                ]
            },
            {
                test: /\.json$/,
                loader: "json"
            }
        ]
    },

        // http://cheng.logdown.com/posts/2016/03/25/679045
        // https://webpack.github.io/docs/configuration.html#devtool

        // off - [aby użyć tego trzeba zakomentować całą sekcję new webpack.SourceMapDevToolPlugin({ ]
    devtool: (env === 'dev') ? false : 'source-map', // full source map (podobno wolne)
    // devtool: "cheap-source-map", // nieczytelne

        // on - [te używamy z włączoną sekcją new webpack.SourceMapDevToolPlugin({ ]
    // devtool: "cheap-module-source-map", // for prod
    // devtool: "cheap-module-eval-source-map", // for dev - nieczytelne
    // devtool: "cheap-module-source-map", // for dev - nie widać kodu w ogóle w zakładce debug w ff
}