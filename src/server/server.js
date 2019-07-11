/* eslint-disable no-console */

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const http = require('http').Server(app);

const config = require('./lib/Config');

const LEDController = require('./lib/LEDController');
const Router = require('./routes/Router');

const distPath = path.resolve(__dirname, '../../dist');
const clientPath = path.resolve(distPath, 'client');

let ledController;

app.set('mode', process.env.NODE_ENV || 'production');
app.set('clientPath', path.resolve(__dirname, '../../dist/client/'));
app.set('json spaces', 2);

const run = () => {
  console.log('Initialising...');

  // development
  if (app.get('mode') === 'development') {
    // use a webpack dev server with hot middleware
    console.log('Development Environment: Starting Webpack Hot Reload...');

    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const webpack = require('webpack');
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const webpackDevMiddleware = require('webpack-dev-middleware');
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const webpackConfig = require(process.env.WEBPACK_CONFIG ? process.env.WEBPACK_CONFIG : '../../webpack.config');
    const compiler = webpack(webpackConfig);

    app.use(webpackDevMiddleware(
      compiler, {
        logLevel: 'warn',
        publicPath: webpackConfig.output.publicPath,
      },
    ));

    // Attach the hot middleware to the compiler & the server
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    app.use(require('webpack-hot-middleware')(
      compiler, {
        log: console.log,
        path: '/__webpack_hmr',
        heartbeat: 2 * 1000,
      },
    ));
  // production
  } else {
    console.log('Production Environment');
  }

  // middleware
  app.use(bodyParser.json());

  // public assets
  app.use(express.static(path.resolve(clientPath)));

  // API Routes
  app.use(Router.registerRoutes(app, ledController));

  // host server
  try {
    http.listen(config.installation.port, () => {
      console.log(`listening on port ${config.installation.port}`);
    });
  } catch (ex) {
    throw new Error(`Failed to begin http server on port ${config.installation.port}: ${ex}`);
  }
};

// Fire up the led controller
ledController = new LEDController(http, config);
run();
