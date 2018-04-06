#!/bin/bash


( sleep 5 ; echo "test" ) &


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
    echo -e "\n"
else
    echo 'try to restart'
    echo -e "\n"

    ( sleep 5 ; /bin/bash all.sh start ) &
fi

