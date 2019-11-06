
# /bin/bash bash/deploy/relink.sh

set -e
set -x

THISFILE=${BASH_SOURCE[0]}
DIR="$( cd "$( dirname "${THISFILE}" )" && pwd -P )"
cd "$DIR"

CURRENT="$(dirname $(pwd))"
CURRENT="$(dirname $CURRENT)"
CURRENT="$(basename $CURRENT)"

echo ">CURRENT>>$CURRENT<<<"
echo ">realpath ../../..>>$(realpath ../../..)<<<"

unlink ../../../current || true

(cd ../../.. && ln -s $CURRENT current);
