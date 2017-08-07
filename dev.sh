#!/bin/bash

PARSER_HOST=$(node test/param.js  parser.hostname)
PARSER_PORT=$(node test/param.js  parser.port)
TESTEN_HOST=$(node test/param.js  testendpoints.hostname)
TESTEN_PORT=$(node test/param.js  testendpoints.port)

echo 'killing processes...';

kill -SIGTERM $(ps aux | grep "testmode" | grep -v grep | head -1 | awk '{print $2}') &> /dev/null && echo 'killed' || echo 'nothing to kill'
kill -SIGTERM $(ps aux | grep "testmode" | grep -v grep | head -1 | awk '{print $2}') &> /dev/null
kill -SIGTERM $(ps aux | grep "testmode" | grep -v grep | head -1 | awk '{print $2}') &> /dev/null

if [ "$#" == 0 ] || [ "$#" -gt 1 ] ; then
	echo "call: /bin/bash $0 start";
else
    echo 'starting parser...';

    npm run parser ${PARSER_HOST} ${PARSER_PORT} testmode & disown

    cd test
        echo 'starting testing endpoints server...';
        node server.js ${TESTEN_HOST} ${TESTEN_PORT} testmode & disown
        # http://localhost:92/crawler/index.html
    cd ..
    sleep 3

    echo 'testing servers...';

    curl "${PARSER_HOST}:${PARSER_PORT}" &> /dev/null && echo 'PARSER     : working' || echo 'PARSER     : not working';
    curl "${TESTEN_HOST}:${TESTEN_PORT}" &> /dev/null && echo 'TESTSERVER : working' || echo 'TESTSERVER : not working';

#    npm run parser &>> static/log.html & disown
#    npm run parser

#    node parser.js test/config.js
#    curl 'http://138.68.156.126:91/fetch?url=http://localhost:92/crawler/index.html' \
#    -H 'Content-type: application/json; charset=UTF-8' \
#    --data-binary '{"returnonlyhtml":true}' --compressed
fi

