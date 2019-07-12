/* eslint-disable no-console */

const path = require('path');
const express = require('express');

const server = express();
const http = require('http').Server(server);

const config = require('./lib/config');

server.set('mode', process.env.NODE_ENV || 'production');
server.set('clientPath', path.resolve(__dirname, '../../dist/client/'));
server.set('json spaces', 2);

const { Kernel } = require('./lib/Kernel');

// eslint-disable-next-line no-unused-vars
const kernel = new Kernel(server, http, config);
