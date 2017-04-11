#!/bin/bash

if [ "$#" == 0 ] || [ "$#" -gt 1 ] ; then
	echo "call: /bin/bash $0 $\$";
else
    echo "running: /bin/bash lh.sh $1 $$"
    /bin/bash agp.sh $1 $$ &>> /dev/null & disown
    sleep 4
    echo 'run agp crawler'
    sleep $((60 * 60 * 3)) && /bin/bash lh.sh &>> /dev/null & disown
fi

