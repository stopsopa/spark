/**
 * @author Szymon Działowski
 * @date 29 Nov 2017
 * @license MIT
 */
var http        = require('http');

var path        = require('path');

var fs          = require('fs');

const spawn      = require('child_process').spawn;

var thisScript = path.basename(__filename);

var script    = 'node ' + thisScript;

var sp = ['node', [thisScript]];

const log = function () {
    Array.prototype.slice.call(arguments).map(i => i + "\n").forEach(i => process.stdout.write(i));
};

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};
function isObject(a) {
    return Object.prototype.toString.call(a) === '[object Object]';
};

const raceThrottleDebounce = (function () {

    var crypto = require('crypto');

    return function (fn) {

        var last            = false;

        var triggeredFor    = false;

        var args;

        var newFn = function () {

            last = (new Date()).getTime() + crypto.randomBytes(5).toString('hex');

            args = Array.prototype.slice.call(arguments);

            if (triggeredFor) {

                return ;
            }

            triggeredFor = last;

            return fn.apply(this, args);
        };

        newFn.unlock = function () {

            if (triggeredFor === last) {

                return triggeredFor = last = false;
            }

            triggeredFor = false;

            newFn.apply(this, args);
        };

        return newFn;
    }
}());

const args = (function (obj, tmp) {
    process.argv
        .slice(2)
        .map(a => {

            if (a.indexOf('--') === 0) {

                tmp = a.substring(2).replace(/^\s*(\S*(\s+\S+)*)\s*$/, '$1');

                if (tmp) {

                    obj[tmp] = (typeof obj[tmp] === 'undefined') ? true : obj[tmp];
                }

                return;
            }

            if (a === 'true') {

                a = true
            }

            if (a === 'false') {

                a = false
            }

            if (tmp !== null) {

                if (obj[tmp] === true) {

                    return obj[tmp] = [a];
                }

                obj[tmp].push(a);
            }
        })
    ;

    Object.keys(obj).map(k => {
        (obj[k] !== true && obj[k].length === 1) && (obj[k] = obj[k][0]);
        (obj[k] === 'false') && (obj[k] = false);
    });

    return {
        all: () => JSON.parse(JSON.stringify(obj)),
        get: (key, def) => {

            var t = JSON.parse(JSON.stringify(obj));

            if (typeof def === 'undefined')

                return t[key];

            return (typeof t[key] === 'undefined') ? def : t[key] ;
        },
        update: data => {

            delete data['config'];

            delete data['dump'];

            delete data['help'];

            delete data['inject'];

            obj = data;
        }
    };
}({}));

// const config = {/*  */}
// const log = console.log;

// // // https://nodejs.org/docs/latest/api/all.html#modules_accessing_the_main_module
// if (require.main === module) {

//     function isObject(a) {
//         return ['[object Object]',"[object Array]"].indexOf(Object.prototype.toString.call(a)) > -1;
//     };

//     const a = process.argv.slice(2);

//     if (a.indexOf('--param') > -1) {

//         const key = ( a[1] || '' ).split('.');

//         let k, tmp = config;

//         while (k = key.shift()) {

//             tmp = tmp[k];
//         }

//         if (isObject(tmp)) {

//             process.stdout.write(JSON.stringify(tmp, null, '    '));
//         }
//         else {

//             process.stdout.write(tmp + '');
//         }

//     }

// }
// else {

//     module.exports = config;
// }

if (args.get('help')) {

    process.stdout.write(`
Standalone static files http server with no dependencies
    
@author Szymon Działowski https://github.com/stopsopa
@date 29 Nov 2017
@license MIT    

parameters:

    --port [port]               def: 8080
    
    --dir [path]                def: '.' 
        relative or absolute path to directory with files to serve
        
    --config [filepath.json]    def: false
    
        path to config file (json format), file can containe object where 
        kays are parameters of this script ('config' param in file will be ignored)        
    
    --noindex                   def: false  
        disable indexing directories content if url points to directory
        
    --log [level]               def: 1
    
        binary mask:
        
            0 - show nothing
            1 - show 404, 
            2 - show 200, 
            4 - show 301
            8 - autoindex
            
            more examples:
                3 - show 404 and 200
                6 - show 200 and 301
                7 - show all without autoindex
                15 - show all
                
    --watch [regex]            def: false
    
        reload currently opened page in browser when files will change
        
        examples:
            node ${thisScript} --watch                                  - watch all files (can be slow)
            node ${thisScript} --watch '/\\.js$/i'                       - reload only when files with 'js' extension will change
            node ${thisScript} --watch '\\.js$'                          - like above but shorter syntax (if no regex flags)
            node ${thisScript} --watch '/\\.js$/i' --watch '/\\.html$/i'  - reload for 'js' and 'html' files
            node ${thisScript} --watch '/\\.(js|html)$/i'                - like above but in one regex
            
    --ignore [regex]           def: '/^(.*?\\/)?\\.[^\\/]+$/g' (all files starting from ".")
        
        ignore watching files (this param takes precedense over --watch param)
        
        
    --debug [true|false]        def: false
    
        flag for debugging --watch and --ignore parameters behaviour
        
    --dump 
    
        output config
        
    --flag 
    
        just extra allowed flag for searching processes using 'ps aux | grep [flagvalue]'
    
`);
    process.exit(0);
}

var config  = args.get('config');

var dump    = args.get('dump');

if (config) {

    var configData = require(path.resolve(__dirname, config));

    if ( ! isObject(configData) ) {

        throw `data from config file '${config}' should be an object`;
    }

    args.update(Object.assign(configData, args.all()));
}

args.update(args.all());

if (dump) {

    log(JSON.stringify(args.all(), null, '    '));
}

const diff = function(a, b) {
    return a.filter(function(i) {return b.indexOf(i) < 0});
};

(function (d) {
    if (d.length) {

        log(`Unknown parameters: ${d.join(', ')}\ncheck \n\n    node ${thisScript} --help\n\nfor more help`);

        process.exit(1);
    }
}(diff(Object.keys(args.all()), 'port dir noindex log help watch ignore inject debug config dump flag'.split(' '))));

function execArgs (args, str) {
    var arr = ['--inject'];
    Object.keys(args).forEach(key => {
        if (['watch', 'ignore'].indexOf(key) > -1) {

            return;
        }
        if (isArray(args[key])) {
            args[key].forEach(val => {
                arr.push('--' + key)
                arr.push(val)
            });
        }
        else {
            if (args[key] === true) {
                arr.push('--' + key)
            }
            else {
                arr.push('--' + key)
                arr.push(args[key])
            }
        }
    });

    if (str) {

        return arr.map(a => '"' + (a + '').replace(/"/g, '\\"') + '"').join(' ')
    }

    return arr;
}

var dir     = path.resolve(__dirname, args.get('dir', '.'));

var regexps = (function () {
    function split(reg) {

        var tmp = reg.substring(1).match(/^(.*)\/([^\/]*)$/);

        if (tmp) {

            return tmp.slice(1);
        }

        return [reg];
    }
    return function (list, debug) {
        return list.filter(i => (typeof i === 'string')).filter(i => i.replace(/^\s*(\S*(\s+\S+)*)\s*$/, '$1')).map(i => {
            if (i[0] === '/') {
                i = split(i);
                return new RegExp(i[0], i[1]);
            }
            return new RegExp(i);
        });

    }
}());

var debug   = args.get('debug');

var ignore  = args.get('ignore', '/^\\./');

if (ignore === true) {

    ignore = false;
}
else {

    if ( ! isArray(ignore)) {
        ignore = [ignore];
    }

    ignore = regexps(ignore).filter(i => i);

    if (ignore.length === 0) {

        ignore = false;
    }
}

var watch   = args.get('watch', false);

if (typeof watch !== 'boolean') {

    if ( ! isArray(watch) ) {

        watch = [watch];
    }

    watch = regexps(watch);

    if (watch.length === 0) {

        watch = true;
    }
}

script += ' ' + execArgs(args.all(), true);

sp[1] = sp[1].concat(execArgs(args.all()));

if (watch) {

    var child;

    var event = raceThrottleDebounce(function (eventType, filename) {

        debug && log('try: ' + filename);

        if (filename) {

            if (isArray(ignore)) {

                for (var i = 0, l = ignore.length ; i < l ; i += 1 ) {

                    debug && log(`before test (ignore): /${ignore[i].source}/${ignore[i].flags} against: `+ filename);

                    if (ignore[i].test(filename)) {

                        debug && log(`ignored: /${ignore[i].source}/${ignore[i].flags} `+ filename);

                        return event.unlock();
                    }
                }
            }

            if (isArray(watch)) {

                for (var matched = false, i = 0, l = watch.length ; i < l ; i += 1 ) {

                    debug && log(`before test (watch): /${watch[i].source}/${watch[i].flags} against: `+ filename);

                    if (watch[i].test(filename)) {

                        debug && log(`matched: /${watch[i].source}/${watch[i].flags} `+ filename);

                        matched = true;

                        break;
                    }
                }

                if ( ! matched ) {

                    return event.unlock();
                }
            }
        }

        if (child) {

            log(eventType + ': ' + filename + ', restarting process: ' + script);

            child.kill();
        }

        child = spawn(sp[0], sp[1]);

        child.stdout.on('data', (data) => process.stdout.write(data));

        event.unlock();
    });

    event();

    fs.watch(dir, {
        recursive: true
    }, event);
}
else {

    var port    = parseInt(args.get('port', 8080), 10);

    var logs    = parseInt(args.get('log', 1), 10);

    var inject   = args.get('inject');

    var type = (function (types) {
        return function (req, res, ext) {

            ext = ext || path.extname(req.url.toLowerCase().split('?')[0]).replace(/[^a-z0-9]/g, '');

            types[ext] && res.setHeader('Content-Type', types[ext]);

            return ext;
        }
    }((function (type) {
        type.jpeg = type.jpg;
        return type;
    }({
        html    : 'text/html; charset=utf-8',
        js      : 'application/javascript; charset=utf-8',
        css     : 'text/css; charset=utf-8',
        json    : 'application/json; charset=utf-8',
        txt     : 'text/plain; charset=utf-8',
        gif     : 'image/gif',
        bmp     : 'image/bmp',
        jpg     : 'image/jpeg',
        png     : 'image/png',
        pdf     : 'application/pdf',
        ico     : 'image/x-icon',
    }))));

    function time() {
        return (new Date()).toISOString().substring(0, 19).replace('T', ' ');
    }

    var server = http.createServer().listen(port);

    function noAccess(req, res, isDir, notype) {

        res.statusCode = 403;

        type(req, res, 'html');

        (logs & 2) && log(`${time()} \x1b[35m${res.statusCode}\x1b[0m: ${req.url}`);

        res.end(`<div style="color: #92317B; font-family: tahoma;">${notype ? '' : (isDir ? 'directory' : 'file')} ${req.url} no access.</div>`);
    }

    var uniq = (function unique(pattern) {
        return pattern.replace(/[xy]/g,
            function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    }('xyxyxyxyxyxyx'));

    function addWatcher(content, ext) {

        if (inject && ext === 'html') {

            content = content.replace(
                /(<\s*\/\s*body\s*>)/i,
                `<script>(function run(uniq){fetch('?watch='+uniq).then(res=>res.text()).then(hash=>run(hash),()=>(function test(){return fetch(location.href).then(()=>location.href=location.href,()=>setTimeout(test,500))}()))}('${uniq}'))</script>$1`
            );
        }

        return content;
    }

    server.on('request', function (req, res) {

        if (inject) {

            var test = req.url.match(/\?watch=(.*)/);

            if (test) {

                if (test[1] !== uniq) {

                    return res.end(uniq)
                }

                return;
            }
        }

        var url = req.url.split('?')[0];

        var file = path.resolve(dir, '.' + path.sep + (decodeURI(url).replace(/\.\.+/g, '.')));

        if (fs.existsSync(file)) {

            var isDir = fs.statSync(file).isDirectory();

            if (isDir) {

                if (args.get('noindex')) {

                    return noAccess(req, res, isDir, true);
                }

                if (url.length > 1 && url.substr(-1) !== '/') {

                    res.writeHead(302, { 'Location': url + '/' });

                    (logs & 4) && log(`${time()} \x1b[33m${res.statusCode}\x1b[0m: ${url} -> ${url + '/'}`);

                    return res.end();
                }

                try {

                    var list = `
    <body>
    <style>
        *{font-family:tahoma;font-size:12px}
        ul{padding:0;list-style-type:none}
        a{padding-right:20px;padding-left:3px;margin-left:3px;border-left:1px solid transparent}
        a:hover{border-left:1px solid gray}
    </style>
    <ul><li>📁<a href=".."> .. </a></li></body>
    `;
                    list += fs.readdirSync(file).map(f => {
                        var dir = fs.statSync(path.resolve(file, f)).isDirectory();
                        return `<li>${dir?'📁':'📄'}<a href="./${f}${dir?'/':''}">${f}</a></li>`;
                    }).join("\n");

                    list += '</ul>';
                }
                catch (e) {

                    return noAccess(req, res, isDir);
                }

                (logs & 8) && log(`${time()} \x1b[36m${res.statusCode}\x1b[0m: [\x1b[36mautoindex\x1b[0m] ${req.url}`);

                return res.end(addWatcher(list, type(req, res, 'html')));
            }

            try {

                res.end(addWatcher(fs.readFileSync(file), type(req, res)));
            }
            catch (e) {

                return noAccess(req, res, isDir);
            }

            (logs & 2) && log(`${time()} \x1b[32m${res.statusCode}\x1b[0m: ${req.url}`);
        }
        else {

            res.statusCode = 404;

            res.end(`<div style="color: #b10000; font-family: tahoma;">status code ${res.statusCode}: ${req.url}</div>`);

            (logs & 1) && log(`${time()} \x1b[31m${res.statusCode}\x1b[0m: ${req.url}`);
        }
    });

    log(`
         🌎  Listening on port ${port}, start time: ${time()}
            serving files from directory ${dir}, --help for more info
    `);

}