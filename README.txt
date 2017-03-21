node version v4.2.6 -- works well
node version v7.6.0 -- works well

---- installation of nightmare with xvfb --- vvv

apt-get update &&\
    apt-get install -y libgtk2.0-0 libgconf-2-4 \
    libasound2 libxtst6 libxss1 libnss3 xvfb    

Xvfb -ac -screen scrn 1280x2000x24 :9.0 &> /dev/null & disown

oraz    BARDZO WAŻNE ABY DODAĆ TO DO .bashrc
export DISPLAY=:9.0

diagnose:
    sudo apt-get install x11-utils
    xdpyinfo -display :9.0 >/dev/null 2>&1 && echo "In use" || echo "Free"

git clone https://github.com/stopsopa/spark.git spark
cd spark
npm install -g yarn
yarn install

npm run supervisor 0.0.0.0 8080 &
npm run start 0.0.0.0 80 &
echo '<head><meta http-equiv="refresh" content="4"></head><body><pre>' > static/log.html && node crawler.js &>> static/log.html & disown
echo '<pre>' > static/log.html && node crawler.js &>> static/log.html & disown

# vagrant for testing

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.synced_folder ".", "/vagrant/vbox"
  config.vm.network "private_network", ip: ENV["VM_TEST"] || "172.28.121.1"
  config.vm.provider "virtualbox" do |vb|
    vb.name = "vagrant-nightmare"
    vb.memory = "2524"
    # vb.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
  end
  config.vm.hostname = "vagrant-nightmare"
end

---- installation of nightmare with xvfb --- ^^^

update spark_cache set updateRequest = FROM_UNIXTIME(UNIX_TIMESTAMP() + (100000 - length(url)))


yarn install

npm run test
npm run start
http://localhost/sandbox.html

npm run start 0.0.0.0 80

(sudo killall electron && echo 'killed' || echo 'nothing to kill') && (sudo killall node && echo 'killed' || echo 'nothing to kill') && sudo npm run start 0.0.0.0 80

#kill and run for tests
    ((kill $(ps aux | grep "killme" | grep -v grep | grep -v sh | head -1 | awk '{print $2}')) && echo 'killed' || echo 'nothing to kill') && npm run start 0.0.0.0 81 killme & disown
    and then
    http://xxxx:81/sandbox.html

window.nmsc = window.nmsc || []; nmsc.push(true);

/// headless browser testing travis-ci
https://docs.travis-ci.com/user/gui-and-headless-browsers/


---- further research ----
https://github.com/oliviertassinari/react-swipeable-views


---- further research ----- vvv
grab html : lib\server.js:400
---- further research ----- ^^^

--- manual work ---- vvv
delete from spark_cache where id != '42099b4af021e53fd8fd4e056c2568d7c2e3ffa8'
node early_spider.js
--- manual work ---- ^^^

411 pages within 31 minut [1860 sek] => 4.52 sek per page

---- test --- vvv
 npm run start 138.68.156.126 8081
---- test --- ^^^


=== x crush log ====
root     11779  0.0 22.3 390544 227116 ?       S    Mar15   1:41 Xvfb -ac -screen scrn 1280x2000x24 :9.0
2017-03-17-12-41-57
root     11779  0.0 22.3 390544 227116 ?       S    Mar15   1:41 Xvfb -ac -screen scrn 1280x2000x24 :9.0
2017-03-17-12-46-57
root     11779  0.0 22.3 390544 227116 ?       S    Mar15   1:41 Xvfb -ac -screen scrn 1280x2000x24 :9.0
2017-03-17-12-51-57
root     11779  0.0 23.0 390916 234176 ?       S    Mar15   1:42 Xvfb -ac -screen scrn 1280x2000x24 :9.0
2017-03-17-12-56-57
root     11779  0.0 23.4 394672 238220 ?       S    Mar15   1:43 Xvfb -ac -screen scrn 1280x2000x24 :9.0
2017-03-17-13-01-57
root     11779  0.0 23.7 397828 241540 ?       S    Mar15   1:45 Xvfb -ac -screen scrn 1280x2000x24 :9.0
2017-03-17-13-06-58
root     11779  0.0 24.0 401060 244548 ?       S    Mar15   1:47 Xvfb -ac -screen scrn 1280x2000x24 :9.0
2017-03-17-13-11-58
2017-03-17-13-16-58
2017-03-17-13-21-58
2017-03-17-13-26-58
2017-03-17-13-31-58
2017-03-17-13-34-17

--- about testing ---- vvv
https://github.com/epeli/underscore.string/blob/master/package.json
--- about testing ---- ^^^
