
# Script to safely checkout to different branch
# /bin/bash change-branch.sh master

target="$1"

THISFILE=${BASH_SOURCE[0]}
DIR="$( cd "$( dirname "${THISFILE}" )" && pwd -P )"

source "$DIR/../libs/colours.sh";

if [ "$#" -lt 1 ] ; then

    { red "\n[error] At least one argument expected, like: \n\n    /bin/bash $0 \"branch-to-merge\" \n"; } 2>&3

    exit 1;
fi

git merge $target --no-edit

if [[ $? != 0 ]]; then

    { red "[error] merging branch '$target' - failure"; } 2>&3

    exit 1;
fi

{ green "[ok] merging branch '$target' - success"; } 2>&3