#!/bin/bash

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "$var"
}


#    /bin/bash all.sh
#    while true; do /bin/bash cron.sh 31413; sleep 3600; done & disown


CMD="node ping.js http://138.68.156.126/pingdom"

printf "\nCMD: $CMD"

$CMD;

if [ "$?" = "200" ]; then

    CMD="node ping.js http://localhost:456/ping"

    printf "\nCMD: $CMD"

    $CMD;

    if [ "$?" = "200" ]; then

        printf "\nit works"

        exit 0;
    fi
else
    echo 'http://138.68.156.126/pingdom doesnt work, YET but it will be NOW'
fi

echo "> stopping processes";

THISFILE=${BASH_SOURCE[0]}
DIR="$( cd "$( dirname "${THISFILE}" )" && pwd -P )"

LOGDIR="static/logs";
NOW=$(date +%Y-%m-%d-%H-%M-%S);
LOGFILE="${DIR}/${LOGDIR}/${NOW}.log"

echo 'before kill';

sudo /bin/bash kill.sh electron &> /dev/null
sudo /bin/bash kill.sh crawler.js &> /dev/null
sudo /bin/bash kill.sh server.jsx &> /dev/null
sudo /bin/bash kill.sh supervisor &> /dev/null
# sudo /bin/bash kill.sh prerenderlogserver &> /dev/null

sudo /bin/bash kill.sh electron &> /dev/null
sudo /bin/bash kill.sh crawler.js &> /dev/null
sudo /bin/bash kill.sh server.jsx &> /dev/null
sudo /bin/bash kill.sh supervisor &> /dev/null
# sudo /bin/bash kill.sh prerenderlogserver &> /dev/null

echo 'after kill'

if [ $# -gt 1 ] ; then
    ps aux | grep bash | grep -v grep | grep -v "$$" | grep -v "\-bash" | grep -v "  $1" | grep -v "  $2"
    kill $(ps aux | grep bash | grep -v grep | grep -v "$$" | grep -v "\-bash" | grep -v "  $1" | grep -v "  $2" | awk '{print $2}' | grep -v ensure | grep -v cron) &> /dev/null
else
    ps aux | grep bash | grep -v grep | grep -v "$$" | grep -v "\-bash" | grep -v "  $1"
    kill $(ps aux | grep bash | grep -v grep | grep -v "$$" | grep -v "\-bash" | grep -v "  $1" | awk '{print $2}' | grep -v ensure | grep -v cron) &> /dev/null
fi


if [ "$#" == 0 ] || [ "$#" -gt 2 ] ; then
	echo ">> call: /bin/bash $0 $\$";
else
    echo "> terminal pid: $1"
    echo "> script   pid: $$"
    ps aux | grep bash | grep -v grep
    echo '<pre>' > ${LOGFILE}
    while true; do killall Xvfb; killall Xvfb; Xvfb -ac -screen scrn 1280x2000x24 :9.0 & disown; echo "<pre>$(date +%Y-%m-%d_%H-%M-%S) Restart Xvfb..." &>> ${LOGFILE}; sleep $((60 * 10)); done &>> ${LOGFILE} & disown
    npm run supervisor 0.0.0.0 8080 &>> /dev/null & disown
    /bin/bash start.sh 0.0.0.0 80 &>> /dev/null & disown

#    echo "> running: node crawler.js agp 456"
#    node crawler.js agp 456 &>> ${LOGFILE} & disown

#   6 hour
#    echo "> running: node crawler.js lh 454"
#    sleep $((60 * 60 * 6)) && node crawler.js lh 454 &>> ${LOGFILE} & disown


#   12 hours
#    echo "> running: node crawler.js mm 455"
#    sleep $((60 * 60 * 12)) && node crawler.js mm 455 &>> ${LOGFILE} & disown


#   18 hours
    echo "> running: node crawler.js gvhd 453"
    sleep $((60 * 60 * 18)) && node crawler.js gvhd 453 &>> ${LOGFILE} & disown

    # WARNING: CHANGE ALSO IN
    # crawler.js:245
#           3.5h       3.5h       3.5h  = 11h
#       mm       agp        lh

    # node logs_server.js --dir ${LOGDIR} --log 0 --port 88 --flag prerenderlogserver & disown
fi


printf "\n\n    now just go to \n\n        http://138.68.156.126:88/ \n\n    to determine if prerender is working\n\n"



