'use strict';

const path          = require('path');
const fs            = require('fs');

require(path.resolve(__dirname, '..', 'lib', 'rootrequire.js'))(__dirname, '..');

const moment        = require('moment');

const log = console.log;

// constants:
const file = path.resolve(__dirname, '..', 'static', 'pingdom.json');

const alloweddiff = 60 * 60 * 24 * 2 * 1000; // 2 days
const alloweddiffhumanreaddable = '2 days';

module.exports = {
    read: function () {

        let data = {};

        if ( fs.existsSync(file) ) {

            data = JSON.parse(fs.readFileSync(file)) || {};
        }

        return data;
    },
    save: function (data) {

        fs.writeFileSync(file, JSON.stringify(data || {}, null, '    '));

        return this;
    },
    /**
     * Call as init and as update
     */
    set: function (flag) {

        let data = this.read();

        if (flag) {

            data[flag] = moment().format();
        }

        return this.save(data);
    },
    test: function () {

        const data = this.read();

        if ( ! Object.keys(data).length ) {

            return "pingdom log shouldn't be empty";
        }

        const now = moment();

        for (let i in data) {

            if ( Math.abs(moment(data[i]).diff(now)) > alloweddiff ) {

                return `Difference between last update shouldn't be bigger then ${alloweddiffhumanreaddable}, details: hub '${i}', last update: ${moment(data[i]).format()}`;
            }
        }

        return true;
    },
};
