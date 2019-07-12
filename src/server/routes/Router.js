const express = require('express');
const path = require('path');

const ROUTES = require('../../lib/constants/Routes');

const router = express.Router();
const distPath = path.resolve(__dirname, '../../../dist');
const clientPath = path.resolve(distPath, 'client');

/**
 * @description
 * Register routes on the express app
 *
 * @param {object} server the express app
 * @param {Kernel} kernel the application kernel
 */
const registerRoutes = (server, kernel) => {

  // Main App
  router.get(['/', ROUTES.MAIN_APP], (req, res) => {
    res.sendFile(path.resolve(clientPath, 'main.html'));
  });

  // Emulator
  router.get(ROUTES.EMULATOR, (req, res) => {
    res.sendFile(path.resolve(clientPath, 'emulator.html'));
  });

  // TODO: Move these routes into an API router

  // Restart the server
  router.get(ROUTES.RESTART, (req, res) => {
    console.warn('Restart command received... terminating server...');
    res.json({
      success: true,
      message: 'Server Restarting...',
    });
    setTimeout(() => {
      process.exit(0);
    }, 250);
  });

  // 404
  router.get('*', (req, res) => {
    res.status(404);
  });

  return router;
};


module.exports = { registerRoutes };
