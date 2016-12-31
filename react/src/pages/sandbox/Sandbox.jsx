'use strict';

import React from 'react';
import { autobind } from 'core-decorators';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import theme from 'theme/theme';
import trim from 'lodash/trim';
import debounce from 'lodash/debounce';

import {blue500, red500, greenA200} from 'material-ui/styles/colors';

import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';
import Divider from 'material-ui/Divider';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';
import {Tabs, Tab} from 'material-ui/Tabs';
import CircularProgress from 'material-ui/CircularProgress';
import Slider from 'material-ui/Slider';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import ajax from 'lib/ajax';

import ActionAndroid from 'material-ui/svg-icons/action/android';
import ActionFlightTakeoff from 'material-ui/svg-icons/action/flight-takeoff';
// import IcCludDownload from 'material-ui/svg-icons/action/3d-rotation';
import IcCludDownload from 'material-ui/svg-icons/file/cloud-download';
const IcCludDownloadIcon = <IcCludDownload />

var ic_account_balance = <FontIcon className="material-icons md-18" color={red500}>ic_account_balance</FontIcon>




export default class Sandbox extends React.Component {
    static PropTypes = {
        url: React.PropTypes.string.isRequired
    }
    constructor(...args) {
        super(...args);

        this.notLess = 100;

        this.state = {
            url: '',
            onlyHtml: true,
            tab: 'request', // request, html, json, printscreen
            loading: false,
            method: 'json',
            ajaxwatchdog: true,
                waitafterlastajaxresponse: 1000,
                longestajaxrequest: 5000,

            errorUrl: ''
        };

        this.onChangeLAR = debounce(this.onChangeLAR.bind(this), 150);
        this.onChangeWALAR = debounce(this.onChangeWALAR.bind(this), 150)
    }
    @autobind
    onChangeUrl(e) {
        this.setState({
            url: e.target.value
        });
    }
    @autobind
    onChangeMethod(e, value) {
        this.setState({
            method: value
        });
    }
    @autobind
    onChangeOnlyHtml(e, value) {
        this.setState({
            onlyHtml: value
        });
    }
    @autobind
    onToggleAjaxWatchdog(e, value) {
        this.setState({
            ajaxwatchdog: value
        });
    }
    onFetch(method, e) {

        if (!trim(this.state.url)) {
            return this.setState({
                errorUrl: "Url can't be empty"
            });
        }

        this.setState({
            errorUrl: '',
            loading: true
        });

        ajax[this.state.method](this.props.url, {
            data: {
                url: this.state.url,
                returnonlyhtml: this.state.onlyHtml
            }
        })
        .done((json) => {
            log('data', json);
            
        })
        .always(() => {
            this.setState({
                loading: false
            })
        });
    }
    @autobind
    onTabChange(tab) {
        this.setState({
            tab: tab
        })
    }
    onChangeWALAR(e, value) {
        this.setState((ps, props) => {

            const fuse = value + this.notLess;

            var val = {
                waitafterlastajaxresponse: value
            };

            if (fuse > ps.longestajaxrequest) {
                val.longestajaxrequest = fuse;
            }

            return val;
        });
    }
    onChangeLAR(e, value) {
        this.setState((ps, props) => {

            // waitafterlastajaxresponse: 1000,
            //     longestajaxrequest: 5000,
            const fuse = value - this.notLess;

            var val = {
                longestajaxrequest: value
            };

            if (fuse < ps.waitafterlastajaxresponse) {
                val.waitafterlastajaxresponse = fuse;
            }

            return val;
        });
    }
    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
                <div>
                    <div>
                        <TextField
                            hintText="Url"
                            fullWidth={true}
                            onChange={this.onChangeUrl}
                            value={this.state.url}
                            errorText={this.state.errorUrl}
                            disabled={this.state.loading}
                        />
                    </div>
                    <div className="buttons">
                        <div>
                            <RadioButtonGroup
                                name="Method"
                                defaultSelected="json"
                                valueSelected={this.state.method}
                                onChange={this.onChangeMethod}
                            >
                                <RadioButton
                                    value="json"
                                    label="json"
                                    disabled={this.state.loading}
                                />
                                <RadioButton
                                    value="post"
                                    label="post"
                                    disabled={this.state.loading}
                                />
                                <RadioButton
                                    value="get"
                                    label="get"
                                    disabled={this.state.loading}
                                />
                            </RadioButtonGroup>
                        </div>
                        <RaisedButton
                            label={this.state.method.toUpperCase()}
                            primary={true}
                            icon={IcCludDownloadIcon}
                            onClick={this.onFetch.bind(this, 'json')}
                            disabled={this.state.loading}
                            style={{
                                width: 96
                            }}
                        />
                        <div>
                            <Toggle
                                label="Only html"
                                defaultToggled={this.state.onlyHtml}
                                onToggle={this.onChangeOnlyHtml}
                                labelPosition="right"
                                disabled={this.state.loading}
                                style={{
                                    minWidth: 170
                                }}
                            />
                            <Toggle
                                label="Ajax watchdog"
                                defaultToggled={this.state.ajaxwatchdog}
                                onToggle={this.onToggleAjaxWatchdog}
                                labelPosition="right"
                                disabled={this.state.loading}
                                style={{
                                    minWidth: 170
                                }}
                            />
                        </div>
                        {this.state.ajaxwatchdog &&
                            <div>
                                <p className="slider-label">Wait for last ajax response [{this.state.waitafterlastajaxresponse}]</p>
                                <Slider
                                    value={this.state.waitafterlastajaxresponse}
                                    min={200} max={3000} step={100}
                                    onChange={this.onChangeWALAR}
                                    sliderStyle={{
                                        width: 200,
                                        marginTop: 2,
                                        marginBottom: 2
                                    }}
                                />
                                <p className="slider-label">Longest ajax request [{this.state.longestajaxrequest}]</p>
                                <Slider
                                    value={this.state.longestajaxrequest}
                                    min={1000} max={10000} step={100}
                                    onChange={this.onChangeLAR}
                                    sliderStyle={{
                                        width: 200,
                                        marginTop: 2,
                                        marginBottom: 2
                                    }}
                                />
                            </div>
                        }
                        {this.state.loading &&
                            <CircularProgress
                                size={20}
                                style={{
                                    marginLeft: 'auto'
                                }}
                            />
                        }
                    </div>
                    <div>
                        <Tabs
                            value={this.state.tab}
                            onChange={this.onTabChange}
                        >
                            <Tab label="Request" value="request">
                                Request content
                            </Tab>
                            <Tab label="Html" value="html">
                                Html content
                            </Tab>
                            <Tab label="Json" value="json">
                                Json content
                            </Tab>
                            <Tab label="Printscreen" value="preentscreen">
                                Printscreen content
                            </Tab>
                        </Tabs>
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}