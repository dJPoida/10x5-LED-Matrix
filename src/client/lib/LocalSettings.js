let localSettings;

/**
 * @class LocalSettings
 *
 * @description
 * A singleton class for loading and storing the local client settings into local storage
 */
class LocalSettings {

  /**
  * @Constructor
  */
  constructor() {
    this._settings = {};
    this._restoreLocalSettings();
  }


  /**
   * @description
   * Create a new instance of the toaster if one does not already exist
   *
   * @returns {Toaster}
   */
  static getInstance = () => {
    if (!localSettings) {
      localSettings = new LocalSettings();
      window.localSettings = localSettings;
    }

    return localSettings;
  }


  /**
   * @description
   * Load the local storage save data into this object
   *
   * @private
   */
  _restoreLocalSettings = () => {
    this._settings = JSON.parse(localStorage.saveData || null) || {};
  }


  /**
   * @description
   * Load the local storage save data into this object
   *
   * @private
   */
  _saveLocalSettings = () => {
    localStorage.saveData = JSON.stringify(this._settings);
  }


  /**
   * @description
   * Retrieve a specific setting from the local storage
   *
   * @param {string} key the key of the setting to retrieve
   *
   * @returns {any}
   */
  get = (key) => {
    if (key in this._settings) {
      return this._settings[key];
    }
    return undefined;
  }


  /**
   * @description
   * Set a specific setting from the local storage
   *
   * @param {{[key: string]: any}} keyValuePair the keys and values to store
   */
  set = (keyValuePair) => {
    // Update the internal value
    this._settings = {
      ...this._settings,
      ...keyValuePair,
    };
    this._saveLocalSettings();
  }

}

export default LocalSettings.getInstance();
