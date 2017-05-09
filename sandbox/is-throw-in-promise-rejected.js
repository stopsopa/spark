var log = console.log;

Promise.resolve().then(function () {
    throw "it's true...";
}).catch(function (e) {
    log('if this will be called, that mean... ', e)
});

(new Promise(function (resolve) {
    throw "it's true when create"
})).then(function () {
    log("normal resolve - mean it's false")
}, function () {
    log("in new it's true also...")
});

// result:
//
// false...
// if this will be called, that mean...  it's true...
