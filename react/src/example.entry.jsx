'use strict';

// import 'scss/css.scss';
import React from 'react';
import {render} from 'react-dom';
import Sandbox from 'pages/sandbox/Sandbox';

// http://www.material-ui.com/#/get-started/installation
// https://github.com/callemall/material-ui-browserify-gulp-example/blob/f893414ed2f48864f909a9d537b9f332c65488d8/src/app/app.js
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

render(
    <Sandbox url="/fetch"/>,
    document.getElementById('app')
);


