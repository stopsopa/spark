#!/bin/bash

echo "> stopping processes";

sudo /bin/bash kill.sh electron 1> /dev/null 2> /dev/null
sudo /bin/bash kill.sh crawler.js 1> /dev/null 2> /dev/null
sudo /bin/bash kill.sh server.jsx 1> /dev/null 2> /dev/null
sudo /bin/bash kill.sh supervisor 1> /dev/null 2> /dev/null

kill $(ps aux | grep bash | grep -v grep | grep -v "$$" | grep -v "  $1" | awk '{print $2}') &> /dev/null

if [ "$#" == 0 ] || [ "$#" -gt 1 ] ; then
	echo "> call: /bin/bash $0 $\$";
else
    echo "> terminal pid: $1"
    echo "> script   pid: $$"
    ps aux | grep bash | grep -v grep
    echo '<pre>' > static/log.html
    while true; do killall Xvfb; killall Xvfb; Xvfb -ac -screen scrn 1280x2000x24 :9.0 & disown; echo "<pre>$(date +%Y-%m-%d_%H-%M-%S) Restart Xvfb..." >> static/log.html; sleep $((60 * 10)); done &>> /dev/null & disown
    npm run supervisor 0.0.0.0 8080 &>> /dev/null & disown
    /bin/bash start.sh 0.0.0.0 80 &>> /dev/null & disown

    echo "> running: node crawler.js agp"
    node crawler.js agp &>> static/log.html & disown

#    3 hours
#    sleep $((60 * 60 * 3)) && node crawler.js mm &>> static/log.html & disown

#   3.5 hour
    echo "> running: node crawler.js mm"
    sleep $((60 * 30 * 7)) && node crawler.js mm &>> static/log.html & disown


#   7 hours
    echo "> running: node crawler.js lh"
    sleep $((60 * 60 * 7)) && node crawler.js lh &>> static/log.html & disown

    # WARNING: CHANGE ALSO IN
    # crawler.js:245
#           3.5h       3.5h       3.5h  = 11h
#       mm       agp        lh
#
fi


