const fs = require('fs');
const path = require('path');

const packageJson = require('../../../package.json');
const updateObject = require('../../lib/helpers/updateObject');
const appConfig = require('./defaultConfig');

// Load the local config
const localConfigPath = path.resolve(__dirname, '../../../config.json');

let localConfig;
try {
  localConfig = fs.existsSync(localConfigPath) ? JSON.parse(fs.readFileSync(localConfigPath, 'utf8')) : {};
} catch (ex) {
  throw new Error(`Failed to load local "config.json". You may have a minor error in the file.\n${ex}`);
}

// Update the app config with those property keys found in the local config
updateObject(appConfig, localConfig);

// Here's where we would make any changes or update to the config before re-writing it back to disk

// Write the updated app config back to the local config
// (effectively updating it to make it current)
fs.writeFileSync(localConfigPath, JSON.stringify(appConfig, null, 2), 'utf8');

// ==========================================================================
// Add additional properties to the app config for use in the application
// (but not storage in the local config on the file system)

appConfig.appTitle = packageJson.appTitle;
appConfig.version = packageJson.version;
appConfig.versionDate = packageJson.versionDate;
appConfig.versionSuffix = packageJson.version.replace(/\./g, '-');
appConfig.author = packageJson.author;

// Some additional maths that is used commonly based on configuration parameters
appConfig.device.resolution.numLEDs = appConfig.device.resolution.width * appConfig.device.resolution.height;


module.exports = appConfig;
