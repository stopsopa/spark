#!/bin/bash

echo "> stopping processes";

sudo killall electron &> /dev/null
sudo killall electron &> /dev/null
sudo killall electron &> /dev/null
sudo killall node &> /dev/null
sudo killall node &> /dev/null
sudo killall node &> /dev/null

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

    echo "> running: node crawler.js lh"
    node crawler.js lh &>> static/log.html & disown

    echo "> running: node crawler.js agp"
    sleep $((60 * 60 * 3)) && node crawler.js agp &>> static/log.html & disown
fi


