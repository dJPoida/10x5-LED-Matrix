import React from 'react';
import ReactDOM from 'react-dom';
import EmulatorApp from './EmulatorApp';
import '../../../scss/apps/emulator.scss';
import ErrorHandler from '../../components/ErrorHandler';

ReactDOM.render(
  React.createElement(
    ErrorHandler,
    {},
    React.createElement(EmulatorApp, {}, null),
  ), document.getElementById('app'),
);
