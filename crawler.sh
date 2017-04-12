#!/bin/bash

if [ "$#" == 0 ] || [ "$#" -gt 1 ] ; then
	echo "call: /bin/bash $0 $\$";
else
    sudo killall electron &> /dev/null
    sudo killall electron &> /dev/null
    sudo killall electron &> /dev/null
    sudo killall node &> /dev/null
    sudo killall node &> /dev/null
    sudo killall node &> /dev/null
    kill $(ps aux | grep bash | grep -v "$$" | grep -v "  $1" | awk '{print $2}') &> /dev/null
    echo "terminal pid: $1"
    echo "script   pid: $$"
    ps aux | grep bash
    echo '<pre>' > static/log.html
    while true; do killall Xvfb; killall Xvfb; Xvfb -ac -screen scrn 1280x2000x24 :9.0 & disown; echo "<pre>$(date +%Y-%m-%d_%H-%M-%S) Restart Xvfb..." >> static/log.html; sleep $((60 * 30)); done &>> /dev/null & disown
    npm run supervisor 0.0.0.0 8080 &>> /dev/null & disown
    /bin/bash start.sh 0.0.0.0 80 &>> /dev/null & disown
#    #sleep 3
    #echo '<pre>' > static/log.html && node crawler.jsx &>> static/log.html & disown
    node crawler.js &>> static/log.html & disown
fi


