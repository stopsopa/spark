
---- installation of electron --- vvv
    sudo dpkg --add-architecture i386
    sudo apt-get update

    then:
    sudo apt-get install libgtk2.0-0:i386 libxss1 libxi6 libgconf-2-4 libnss3-dev

    and then

    sudo yarn global add electron
    sudo yarn global add electron-prebuilt

    DEBUG=nightmare:* node test.jsx

    sudo npm run supervisor 0.0.0.0 8080
---- installation of electron --- ^^^

yarn install

npm run test
npm run start
http://localhost/sandbox.html

npm run start 0.0.0.0 80

killall node

(sudo killall node && echo 'killed' || echo 'nothing to kill') && sudo npm run start 0.0.0.0 80

window.nmsc = window.nmsc || []; nmsc.push(true);

/// headless browser testing travis-ci
https://docs.travis-ci.com/user/gui-and-headless-browsers/


---- further research ----
https://github.com/oliviertassinari/react-swipeable-views