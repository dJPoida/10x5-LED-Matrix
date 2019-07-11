import React from 'react';
import ReactDOM from 'react-dom';
import MainApp from './MainApp';
import '../../../scss/apps/main.scss';
import ErrorHandler from '../../components/ErrorHandler';

ReactDOM.render(
  React.createElement(
    ErrorHandler,
    {},
    React.createElement(MainApp, {}, null),
  ), document.getElementById('app'),
);
