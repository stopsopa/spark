
---- installation of nightmare with xvfb --- vvv

apt-get update &&\
    apt-get install -y libgtk2.0-0 libgconf-2-4 \
    libasound2 libxtst6 libxss1 libnss3 xvfb    

Xvfb -ac -screen scrn 1280x2000x24 :9.0 &
export DISPLAY=:9.0

git clone https://github.com/stopsopa/spark.git spark
cd spark
npm install -g yarn
yarn install

npm run supervisor 0.0.0.0 8080 &
npm run start 0.0.0.0 80 &

---- installation of nightmare with xvfb --- ^^^





yarn install

npm run test
npm run start
http://localhost/sandbox.html

npm run start 0.0.0.0 80

(sudo killall node && echo 'killed' || echo 'nothing to kill') && sudo npm run start 0.0.0.0 80

window.nmsc = window.nmsc || []; nmsc.push(true);

/// headless browser testing travis-ci
https://docs.travis-ci.com/user/gui-and-headless-browsers/


---- further research ----
https://github.com/oliviertassinari/react-swipeable-views
