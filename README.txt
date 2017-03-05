node version v4.2.6 -- works well

---- installation of nightmare with xvfb --- vvv

apt-get update &&\
    apt-get install -y libgtk2.0-0 libgconf-2-4 \
    libasound2 libxtst6 libxss1 libnss3 xvfb    

Xvfb -ac -screen scrn 1280x2000x24 :9.0 & disown

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





yarn install

npm run test
npm run start
http://localhost/sandbox.html

npm run start 0.0.0.0 80

(sudo killall node && echo 'killed' || echo 'nothing to kill') && sudo npm run start 0.0.0.0 80

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
