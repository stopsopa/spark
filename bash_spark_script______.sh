#!/bin/bash
cd /opt/spark
cat << EOF

Now run two commands to restart prerender:

    /bin/bash all.sh
    while true; do date +"%Y-%m-%d %H:%M:%S vvv" >> /opt/spark/static/logs/cycle.log; /bin/bash cron.sh \$$ >> /opt/spark/static/logs/cycle.log; sleep 3600; done & disown

EOF
