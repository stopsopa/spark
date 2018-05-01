#!/bin/bash

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "$var"
}

TEST=$(curl -vs -o /dev/null  http://138.68.156.126/pingdom 2>&1 | grep 'HTTP/1.1' | grep -v ping);
TEST=$(trim $TEST)

if [ "$TEST" == "< HTTP/1.1 200 OK" ]; then
    echo 'it works'
else
    echo 'try to restart'
    echo "command /bin/bash cron.sh "$$" $1"

    # https://stackoverflow.com/a/20401674/5560682
    function faketty { script -qfc "$(printf "%q " "$@")"; }

    faketty /bin/bash cron.sh "$$" $1
fi

