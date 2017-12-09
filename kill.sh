#!/bin/bash

#set -o xtrace
#set -e

FLAG=$1
THISFILE=$0

if [ "$#" == 0 ] ; then

    echo "give flag parameter"

    exit 1

else

    LIST=$(ps aux | grep $FLAG | grep -v grep | grep -v $THISFILE)

    PIDS=$(ps aux | grep $FLAG | grep -v grep | grep -v $THISFILE | awk '{print $2}');

    echo -e "\nlisting processes to kill:\n";
    echo -e $"$LIST\n"

    echo -e "\nlisting pids to kill:\n";
    echo -e $"$PIDS\n";

    for pid in $PIDS
    do
        echo "attempt to kill $pid"
        $(kill $pid -9) || true
    done

    echo -e "\n"

    exit 0;
fi