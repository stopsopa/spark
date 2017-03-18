#!/bin/bash

PARSER_HOST=$(node config.js 'test.parser.host')
PARSER_PORT=$(node config.js 'test.parser.port')
TESTEN_HOST=$(node config.js 'test.testendpoints.host')
TESTEN_PORT=$(node config.js 'test.testendpoints.port')

echo 'killing processes...';

kill -SIGTERM $(ps aux | grep "testmode" | grep -v grep | head -1 | awk '{print $2}') &> /dev/null && echo 'killed' || echo 'nothing to kill'
kill -SIGTERM $(ps aux | grep "testmode" | grep -v grep | head -1 | awk '{print $2}') &> /dev/null
kill -SIGTERM $(ps aux | grep "testmode" | grep -v grep | head -1 | awk '{print $2}') &> /dev/null
echo -e "\n\n";

echo 'starting servers...';
npm run start ${PARSER_HOST} ${PARSER_PORT} testmode & disown
cd test
node testserver.jsx ${TESTEN_HOST} ${TESTEN_PORT} testmode & disown
cd ..
sleep 3
echo -e "\n\n";


echo 'testing servers...';

curl "${PARSER_HOST}:${PARSER_PORT}" &> /dev/null && echo 'PARSER     : working' || echo 'PARSER     : not working';
curl "${TESTEN_HOST}:${TESTEN_PORT}" &> /dev/null && echo 'TESTSERVER : working' || echo 'TESTSERVER : not working';