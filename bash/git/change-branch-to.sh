
# Script to safely checkout to different branch
# /bin/bash change-branch.sh master

target="$1"

THISFILE=${BASH_SOURCE[0]}
DIR="$( cd "$( dirname "${THISFILE}" )" && pwd -P )"

source "$DIR/../libs/colours.sh";

if [ "$#" -lt 1 ] ; then

    { red "\n[error] At least one argument expected, like: \n\n    /bin/bash $0 \"branch-name\" \n"; } 2>&3

    exit 1;
fi

/bin/bash $DIR/is-commited.sh

git checkout $target;

if [ "$(git rev-parse --abbrev-ref HEAD)" != $target ]; then

    { red "[error] checkout to '$target' - failed"; } 2>&3

    exit 1
fi

{ green "[ok] checkout to '$target' - success"; } 2>&3
