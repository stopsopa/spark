
# I would like rather use stateful function but I have completely idea how to do this in bash
# but this is just for testing so doing this ugly way is still acceptable

function _datetime {
    date "+%Y-%m-%d %H:%M:%S"
}

function _date {
    date "+%Y-%m-%d"
}

function _time {
    date "+%H-%M-%S"
}

if [ "$TRAVIS" == "true" ]; then

    THISFILE=${BASH_SOURCE[0]}
    _DIR="$( cd "$( dirname "${THISFILE}" )" && pwd -P )"
    TMP_FILE="$_DIR/tmp.counter"

    if [ ! -f $TMP_FILE ]; then

        echo '0' > $TMP_FILE
    fi

    if [ ! -f $TMP_FILE ]; then

        printf "\n\n    can't create tmp file: $TMP_FILE \n\n";

        exit 1
    fi

    function _datetime {

        COUNTER="$(cat $TMP_FILE)"

        echo "__${COUNTER}__"

        COUNTER=$(($COUNTER + 1))

        echo $COUNTER > $TMP_FILE
    }
    function _date {
        _datetime
    }
    function _time {
        _datetime
    }
fi
