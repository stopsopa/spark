const log = console.log;
const Nightmare     = require('nightmare');
const base64        = require('base-64');

const plain = !!process.argv[3];

function base64ToObj(base) {
    return JSON.parse(base64.decode(base));
}
function objToBase64(obj) {
    return base64.encode(JSON.stringify(obj));
}

const params = base64ToObj(process.argv[2]);

function ret(flag, data) {

    data = {
        flag: flag,
        data: data
    };

    log(JSON.stringify(data) + params.delimiter);

    // log(plain ? JSON.stringify(data) : objToBase64(data));

    return 0;
}

// return ret('json', [200, params]);

try {

    // var config = {webPreferences : params.nightmare.webPreferences};

    var night = Nightmare(params.nightmare);

    // if (params.timeout > 0) {
    //
    // }
    // var night = Nightmare(config);

    var collect = {};

    var queue = night
            .on('console', function () {
                var args = Array.prototype.slice.call(arguments);

                args[0] = '[browser:'+args[0]+']';

                ret('log', args);
            })
            .on('page', function (type) {

                var args = Array.prototype.slice.call(arguments);

                switch(type) {
                    case 'error':
                        // return json(500, {
                        //     errorType: 'page event error',
                        //     data: args
                        // })
                        return ret('json', [500, {
                            errorType: 'page event error',
                            data: args
                        }])
                    case 'alert':
                    case 'prompt':
                    case 'confirm':

                        args[0] = "[browser:"+args[0]+"]";
                        // return log.apply(this, args);
                        return ret('log', args);
                    default:
                }
            })
            .once('did-get-response-details', function (event, status, newURL, originalURL, httpResponseCode, requestMethod, referrer, headers, resourceType) {
                // https://github.com/segmentio/nightmare#onevent-callback
                // https://github.com/electron/electron/blob/master/docs/api/web-contents.md#class-webcontents
                // log('did-get-response-details', Array.prototype.slice.call(arguments)[7])
                var data = Array.prototype.slice.call(arguments);
                data.push({
                    doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-get-response-details'
                });
                collect['did-get-response-details'] = data;
            })
            .once('did-fail-load', function (event, errorCode, errorDescription, validatedURL, isMainFrame) {
                if (isMainFrame) {
                    var data = Array.prototype.slice.call(arguments);
                    data.push({
                        doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-fail-load'
                    });
                    collect['did-fail-load'] = data;
                }
            })
            .on('did-get-redirect-request', function (event, oldURL, newURL, isMainFrame) {
                if (isMainFrame) {
                    if (!collect['did-get-redirect-request']) {
                        collect['did-get-redirect-request'] = [];
                    }
                    var data = Array.prototype.slice.call(arguments);
                    data.push({
                        doc: 'https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-get-redirect-request'
                    });
                    collect['did-get-redirect-request'].push(data);
                }
            })
            .goto(params.url, params.headers || {})
        ;

    if (params.readyselector) {
        queue = queue.wait(params.readyselector);
    }
    else {
        queue = queue

            // can try to get rid of this later
            .wait('body')

            .evaluate(function (params) {

                params = JSON.parse(params);

                (function (ready) {

                    if (window[params.nmsc] && window[params.nmsc].length) {
                        return ready(window[params.nmsc][0]);
                    }

                    window[params.nmsc] = {
                        push: ready
                    };

                    if (params.ajaxwatchdog) {
                        window.XMLHttpRequest.prototype.onAllFinished(function (status) {
                            window[params.nmsc] = window[params.nmsc] || []; window[params.nmsc].push(status);
                        }, params.ajaxwatchdog.waitafterlastajaxresponse, params.ajaxwatchdog.longestajaxrequest);
                    }

                    // shutdown after interval - for testing
                    // setTimeout(ready, 6000);

                    // build button for manual close for testing
                    // var button = document.createElement('input');
                    // button.setAttribute('type', 'button');
                    // button.value = 'close manually';
                    // document.body.insertBefore(button, document.body.childNodes[0]);
                    //
                    // button.addEventListener('click', function () {
                    //     window.nmsc = window.nmsc || []; nmsc.push(true);
                    // });

                }(function (data) {
                    setTimeout(function () {
                        if (document.getElementById(params.readyid)) {
                            return;
                        }
                        var end = document.createElement('div');
                        end.setAttribute('id', params.readyid);
                        document.body.appendChild(end);
                        window[params.nmsc].ajaxwatchdogresponse = data;
                    }, 50);
                }));
            }, JSON.stringify(params))
            .wait('#' + params.readyid)
            // .screenshot(path.resolve('tmp', params.readyid + '.png')) // for testing
            .evaluate(function (params) {
                params = JSON.parse(params);
                var readyid = document.getElementById(params.readyid);
                readyid.parentNode.removeChild(readyid);
            }, JSON.stringify(params))
        ;
    }

    queue = queue
        .evaluate(function (params) {

            params = JSON.parse(params);

            var data = {
                html: (function () {

                    // https://developer.mozilla.org/en-US/docs/Web/API/Document/doctype
                    // http://stackoverflow.com/a/10162353
                    var node = document.doctype;
                    var html = "<!DOCTYPE "
                        + node.name
                        + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
                        + (!node.publicId && node.systemId ? ' SYSTEM' : '')
                        + (node.systemId ? ' "' + node.systemId + '"' : '')
                        + '>';
                    html += document.documentElement.outerHTML

                    return html;
                }())
            };

            if (window[params.nmsc].ajaxwatchdogresponse) {
                data.ajaxwatchdogresponse = window[params.nmsc].ajaxwatchdogresponse;
            }

            return data;
        }, JSON.stringify(params))
        .end() // end nightmare instance
        .then(function (data) {

            // return ret('log', [200, []])

            data.collect = collect;

            if (params.returnonlyhtml) {

                // res.setHeader('Content-Type', 'text/html; charset=utf-8');

                // return json(collect['did-get-response-details'][4], data.html);
                return ret('json', [collect['did-get-response-details'][4], data.html])
            }

            // return json(collect['did-get-response-details'][4], data)
            return ret('json', [collect['did-get-response-details'][4], data]);
        })
        .catch(function () {

            var args = Array.prototype.slice.call(arguments);

            ret('json', [500, {
                errorType: 'Nightmare crashed - exception',
                details: args
            }])
        })
}
catch (e) {
    ret('json', [500, {
        errorType: 'child process general exception',
        data: e
    }]);
}

