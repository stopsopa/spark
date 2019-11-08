#!/bin/bash
cd /opt/spark
cat << EOF

Now run two commands to restart prerender:

    /bin/bash all.sh
    while true; do /bin/bash cron.sh $$; sleep 86400; done & disown

EOF
