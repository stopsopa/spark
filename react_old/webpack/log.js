module.exports = (function () {
    try {
        return console.log
    }
    catch (e) {
        return function () {}
    }
}());