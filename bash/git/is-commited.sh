

THISFILE=${BASH_SOURCE[0]}
DIR="$( cd "$( dirname "${THISFILE}" )" && pwd -P )"

source "$DIR/../libs/colours.sh";

DIFFSTATUS="$(git status -s)"

if [ "$DIFFSTATUS" != "" ] ; then

    { red "[error] first commit changes"; } 2>&3

    { printf "current git status is:\n\n$DIFFSTATUS\n\n"; } 2>&3

    exit 1;
fi
