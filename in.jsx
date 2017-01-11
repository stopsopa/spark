
const log = console.log;

function base64ToObj(base) {
    return JSON.parse((new Buffer(base, 'base64')).toString('utf-8'));
}
function objToBase64(obj) {
    return (new Buffer(JSON.stringify(obj))).toString('base64');
}
function ret(flag, data) {
    return log(objToBase64({
        flag: flag,
        data: data
    }))
}

setTimeout(() => {

    var obj = base64ToObj(process.argv[2]);


    obj.add = 'addedvalue';

    ret('standard', obj)


    setTimeout(() => {

        obj.add2 = 'addedvalue2';

        ret('standard', obj)

        setTimeout(() => {

            obj.add23 = 'addedvalue23';

            ret('exit', obj)
        }, 3000);
    }, 3000);
}, 300);
