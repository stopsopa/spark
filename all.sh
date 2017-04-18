#!/bin/bash

if [ "$#" == 0 ] || [ "$#" -gt 1 ] ; then
	echo "call: /bin/bash $0 $\$ - stopping processes";

    sudo killall electron &> /dev/null
    sudo killall electron &> /dev/null
    sudo killall electron &> /dev/null
    sudo killall node &> /dev/null
    sudo killall node &> /dev/null
    sudo killall node &> /dev/null

    kill $(ps aux | grep bash | grep -v "$$" | grep -v "  $1" | grep -v "  $2" | awk '{print $2}') &> /dev/null
else
    echo "running: /bin/bash lh.sh $1 $$"
    /bin/bash agp.sh $1 $$ &>> /dev/null & disown
    sleep 4
    echo 'run agp crawler'
    sleep $((60 * 60 * 3)) && /bin/bash lh.sh &>> /dev/null & disown
fi

