

/bin/bash stopall.sh

/bin/bash kill.sh cron.sh $$

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


# now is:
# Last login: Tue May  1 19:29:07 2018 from 88.111.92.17
# root@angelita:~$ ps aux | grep node
# root      1870  0.0  3.5 949896 36496 ?        Sl   May01   0:03 node index.server.js pingserver
# root      3015  0.3  5.5 1215120 56300 ?       Sl   May02   8:06 node server.jsx 0.0.0.0 80
# root      4515  0.0  1.9 884716 20308 ?        Sl   May01   0:00 node logs_server.js --dir static/logs --log 0 --port 88 --flag prerenderlogserver
# root     28789  0.0  0.0  12944  1016 pts/0    S+   09:17   0:00 grep --color=auto node
# root@angelita:~$
#


# 
# and it should be:
# root      1870  0.0  3.5 949896 36496 ?        Sl   May01   0:03 node index.server.js pingserver
# root     29499  0.2  2.8 682460 28852 pts/0    Sl   09:41   0:00 node logs_server.js --dir static/logs --log 0 --port 88 --flag prerenderlogserver
# root     29799  4.6  3.7 1188184 38588 pts/0   Sl   09:42   0:00 node crawler.js agp
# root     29859  0.0  0.0   4512   720 pts/0    S    09:42   0:00 sh -c node server.jsx "0.0.0.0" "80"
# root     29860  0.0  0.0   4512   764 pts/0    S    09:42   0:00 sh -c node supervisor.jsx "0.0.0.0" "8080"
# root     29861  3.3  3.8 890968 39072 pts/0    Sl   09:42   0:00 node server.jsx 0.0.0.0 80
# root     29867  2.1  3.4 884068 34648 pts/0    Sl   09:42   0:00 node supervisor.jsx 0.0.0.0 8080
# root     29878  0.0  0.0  12944   976 pts/0    S+   09:42   0:00 grep --color=auto node
#
