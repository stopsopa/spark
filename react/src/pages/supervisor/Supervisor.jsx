'use strict';

import React from 'react';
import { autobind } from 'core-decorators';
import classnames from 'classnames';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import theme from 'theme/theme';
import trim from 'lodash/trim';
import debounce from 'lodash/debounce';

import {blue500, red500, greenA200} from 'material-ui/styles/colors';

import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import FontIcon from 'material-ui/FontIcon';
import Divider from 'material-ui/Divider';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';
import {Tabs, Tab} from 'material-ui/Tabs';
import CircularProgress from 'material-ui/CircularProgress';
import Slider from 'material-ui/Slider';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import ajax from 'lib/ajax';
import cookies from 'lib/cookies';

import IcCludDownload from 'material-ui/svg-icons/file/cloud-download';
import IcCached from 'material-ui/svg-icons/action/cached';
import IcSave from 'material-ui/svg-icons/content/save';
import icAutrenew from 'material-ui/svg-icons/action/autorenew';
const icCludDownloadIcon = <IcCludDownload />
const icAutrenewIcon = <icAutrenew />

var ic_account_balance = <FontIcon className="material-icons md-18" color={red500}>ic_account_balance</FontIcon>;

var key = 'url';

export default class Supervisor extends React.Component {
    static PropTypes = {
        // url: React.PropTypes.string.isRequired
    }
    constructor(...args) {
        super(...args);

        this.notLess = 100;

        this.state = {

            status: null,
            loading: false,

            ip: "0.0.0.0",
            port: "80"
        };
    }
    componentDidMount() {
        log('did mount')
        this.onCheck();
    }
    @autobind
    onCheck(e) {

        this.setState({
            loading: true
        });

        var state = {};

        ajax.json('/status')
            .done(() => {state.status = true})
            .fail(() => {state.status = false})
            .always(() => {
                this.setState(Object.assign({
                    loading: false
                }, state));
            })
        ;
    }
    @autobind
    onStart() {

        this.setState({
            loading: true,
            status: null
        });

        var state = {};

        ajax.json('/start', {
            data: this.state
        })
        .always(() => {
            this.setState(Object.assign({
                loading: false
            }, state));
        })
        .done(() => {
            setTimeout(this.onCheck, 1000)
        })
        ;
    }
    @autobind
    onStop() {

        this.setState({
            loading: true,
            status: null
        });

        var state = {};

        ajax.json('/stop', {
            data: this.state
        })
        .always(() => {
            this.setState(Object.assign({
                loading: false
            }, state));
        })
        .done(() => {
            setTimeout(this.onCheck, 1000)
        })
        ;
    }
    @autobind
    onChangeIp(e) {
        this.setState({
            ip: e.target.value
        });
    }
    @autobind
    onChangePort(e) {
        this.setState({
            port: e.target.value
        });
    }
    render() {
        let href = location.protocol + "//" + location.hostname + ':' + this.state.port + '/sandbox.html';

        return (
            <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
                <div>

                    <div className="row">
                        <FlatButton
                            onClick={this.onCheck}
                            icon={<IcCached />}
                            disabled={this.state.loading}
                        ></FlatButton>
                        <div>
                            <span className={classnames('status', {
                                unknown: this.state.status === null,
                                green: this.state.status === true,
                                red: this.state.status === false
                            })}></span>
                        </div>
                        <div className="name">
                            {this.state.status === null && 'unknown'}
                            {this.state.status === true && 'on'}
                            {this.state.status === false && 'off'}
                        </div>

                        {this.state.loading &&
                            <CircularProgress
                                size={20}
                            />
                        }
                        <div className="auto"></div>
                    </div>
                    <div className="row">
                        <div>
                            <TextField
                                hintText="Ip"
                                onChange={this.onChangeIp}
                                value={this.state.ip}
                                style={{
                                    width: 90
                                }}
                            />
                            :
                            <TextField
                                hintText="Port"
                                onChange={this.onChangePort}
                                value={this.state.port}
                                style={{
                                    width: 40
                                }}
                            />
                        </div>
                        <FlatButton
                            onClick={this.onStart}
                            label="Start"
                            disabled={ (! (this.state.status === false)) || this.state.loading }
                            style={{
                                marginLeft: 20
                            }}
                        ></FlatButton>
                        <FlatButton
                            onClick={this.onStop}
                            label="Stop"
                            disabled={ (! (this.state.status === true)) || this.state.loading }
                        ></FlatButton>
                    </div>
                    {this.state.status && <a href={href} target="_blank">sandbox</a>}
                </div>
            </MuiThemeProvider>
        );
    }
}