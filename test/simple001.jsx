//Lets require/import the HTTP module
const http          = require('http');
const Nightmare     = require('nightmare');

//Lets define a port we want to listen to
const PORT = 80;

//We need a function which handles requests and send response
function handleRequest(request, response) {

    if (request.url.indexOf('?') < 0) {
        return response.end("provide parameters");
    }

    var night = Nightmare();

    night
        .goto('http://httpd.pl/wincli')
        .wait('body')
        .evaluate(function () {
            return document.documentElement.outerHTML;
        })
        .end() // end nightmare instance
        .then(function (data) {
            response.end(data);
        })
    ;




    // response.end('It Works!! Path Hit: ' + request.url);
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function() {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});