var path = require("path"),
    gulp = require('gulp'),
    webpack = require('webpack-stream'), // https://github.com/shama/webpack-stream
    sass = require('gulp-sass'),
    config = require('./webpack.config'),
    utils = require("./webpack/utils"),
    sourcemaps = require('gulp-sourcemaps')
;

var env = utils.setup(path.resolve('./config.js'));

function swallowError (error) {
    console.log(error.toString());
    this.emit('end')
}

gulp.task("scss", function () {

    var cnf = {
        outputStyle: 'compressed'
    };

    if (utils.env() === 'prod') {
        cnf.errLogToConsole = true;
        // sourceMapEmbed: true,
        // sourceComments: true
        // functions: sassFunctions()
    }

    return gulp.src(utils.con('scss.entries'))
        .pipe(sourcemaps.init())
        .pipe(sass(cnf)
            .on('error', sass.logError)
        )
        .on('error', swallowError)
        .pipe(sourcemaps.write('.', { // https://github.com/floridoo/gulp-sourcemaps#write-options
            addComment: true,
            debug: true,
            identityMap: true,
        }))
        .pipe(gulp.dest(utils.con('scss.output')))
    ;
});

gulp.task('default', function() {
    return gulp.src('')
        .pipe(webpack(config))
        .on('error', swallowError)
        .pipe(gulp.dest(config.output.path))
    ;
});

gulp.task('prod', ['scss', 'default']);

gulp.task('watch', ['prod'], function () {
    utils.con('roots').forEach(function (p) {
        gulp.watch([p + '/**/*.{js,jsx,css,scss}'], ['prod']);
    });

    var entry = utils.con('js.entries');

    if ( Object.prototype.toString.call( entry ) !== '[object Array]' ) {
        entry = [entry];
    }

    entry.forEach(function (p) {
        gulp.watch([p + '/**/*.entry.{js,jsx}'], ['prod']);
    });
});

