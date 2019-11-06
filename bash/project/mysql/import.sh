
if [ "$1" = "--help" ]; then

cat << EOF

  /bin/bash $0 path/to/mysq.sql
  # /bin/bash $0 path/to/mysq.sql.tar.gz - not implemented yet

EOF

    exit 0
fi

THISFILE=${BASH_SOURCE[0]}
DIR="$( cd "$( dirname "${THISFILE}" )" && pwd -P )"

source "$DIR/../../libs/colours.sh";

set -e
set -x

HOST="$(node "$DIR/../../node/env/getter.js" PROTECTED_MYSQL_HOST)"
USER="$(node "$DIR/../../node/env/getter.js" PROTECTED_MYSQL_USER)"
PORT="$(node "$DIR/../../node/env/getter.js" PROTECTED_MYSQL_PORT)"
PASS="$(node "$DIR/../../node/env/getter.js" PROTECTED_MYSQL_PASS)"
DB="$(node "$DIR/../../node/env/getter.js" PROTECTED_MYSQL_DB)"

cat << EOF

  HOST  "$HOST"
  USER  "$USER"
  PORT  "$PORT"
  PASS  "$PASS"
  DB    "$DB"

EOF

if [ ! -e "$1" ]; then

  { red "FILE: '$1' doesn't exist"; } 2>&3

  exit 1
fi


mysql -h "$HOST" -u "$USER" -P$PORT -p$PASS "$DB" < "$1"

