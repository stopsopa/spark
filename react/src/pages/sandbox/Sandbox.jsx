'use strict';

import React from 'react';
import { autobind } from 'core-decorators';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import theme from 'theme/theme';

import {blue500, red500, greenA200} from 'material-ui/styles/colors';

import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';
import Divider from 'material-ui/Divider';
import TextField from 'material-ui/TextField';

import ActionAndroid from 'material-ui/svg-icons/action/android';
import ActionFlightTakeoff from 'material-ui/svg-icons/action/flight-takeoff';

var ic_account_balance = <FontIcon className="material-icons md-18" color={red500}>ic_account_balance</FontIcon>

export default class Sandbox extends React.Component {
    constructor(...args) {
        super(...args);

        this.state = {

        };
    }
    @autobind
    onChangeInput(e) {
        this.setState({
            input: e.target.value
        });
    }
    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
                <div>

                </div>
            </MuiThemeProvider>
        );
    }
}