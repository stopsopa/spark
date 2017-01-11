const spawn = require('child_process').spawn;
const log = console.log;

function base64ToObj(base) {
    return JSON.parse((new Buffer(base, 'base64')).toString('utf-8'));
}
function objToBase64(obj) {
    return (new Buffer(JSON.stringify(obj))).toString('base64');
}

const data = {
    'raz' : 'dwa',
    'list' : ['one', 'two'],
    'pipe' : '|',
    'quotion mark' : '"',
    'apostrophe' : "'",
    'ąę' : 'żź'
};

const proc = spawn('node', ['in.jsx', objToBase64(data)], {
    timeout: 3000
});

var handler = setTimeout(() => {
    proc.kill('SIGHUP')
    log('process kiclled - timeocut');
}, 3000);

proc.stdout.on('data', (data) => {

    var obj = base64ToObj(data.toString('ascii'));

    if (obj.flag === 'exit') {
        clearTimeout(handler);
    }

    log('data', obj);
});

proc.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

proc.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});