#!/bin/bash
cd /opt/spark
cat << EOF

Now run two commands to restart prerender:

    /bin/bash all.sh
    while true; do /bin/bash cron.sh 31413; sleep 3600; done & disown

EOF
