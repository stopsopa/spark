#!/bin/bash
set -e
set -x

THISFILE=${BASH_SOURCE[0]}
DIR="$( cd "$( dirname "${THISFILE}" )" && pwd -P )"

source "$DIR/../libs/colours.sh";

source "$DIR/../libs/trim.sh"

if [ "$#" -lt "2" ]; then

    { red "$0 error: run like /bin/bash $0 pathto/.env ENV_NAME_WITH_FLAG"; } 2>&3

    exit 1
fi

ENVFILE="$DIR/$1";

if [ ! -e "$ENVFILE" ]; then

    { red "$0 error: file: '$ENVFILE' doesn't exist"; } 2>&3

    exit 1;
fi

{ yellow "importing $ENVFILE vvv"; } 2>&3

source $ENVFILE;

{ yellow "importing $ENVFILE ^^^"; } 2>&3

shift;

FLAG_VARIABLE=$1

FLAG="$(eval echo "\$$FLAG_VARIABLE")"

FLAG="$(trim "$FLAG")"

if [ "$FLAG" = "" ]; then

    { red "$0 error: There is no value under global variable '\$$FLAG_VARIABLE'"; } 2>&3

    exit 1
fi

shift;

PROC="$(ps aux | grep "$FLAG-main" | grep -v grep)" || true

PROC="$(trim "$PROC")" || true

if [ "$PROC" == "" ]; then

    { red "\n\n   SERVICE IS OFF\n\n"; } 2>&3

    exit 1;
fi

{ green "\n\n   SERVICE IS ON\n\n"; } 2>&3

