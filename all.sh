

/bin/bash stopall.sh


kill $(ps aux | grep bash | grep -v grep | grep -v "$$" | grep -v " Ss+ " | grep -v " Ss ") &> /dev/null
sudo /bin/bash kill.sh prerenderlogserver &> /dev/null

node logs_server.js --dir static/logs --log 0 --port 88 --flag prerenderlogserver & disown


sleep 3

echo "now run manually: "
echo "    ";
echo "    ";
echo "    while true; do /bin/bash cron.sh \$\$; sleep 120; done & disown";
echo "    ";
echo "    ";
#while true; do /bin/bash cron.sh $$; sleep 120; done & disown
echo 'end...'

# 17732