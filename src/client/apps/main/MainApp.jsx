import React from 'react';

import socketHandler from '../../lib/ClientSocketHandler';
import localSettings from '../../lib/LocalSettings';

import CLIENT_SOCKET_HANDLER_EVENTS from '../../lib/constants/ClientSocketHandlerEvents';
import SERVER_SOCKET_MESSAGE from '../../../lib/constants/ServerSocketMessage';
import CLIENT_SOCKET_MESSAGE from '../../../lib/constants/ClientSocketMessage';

class MainApp extends React.Component {

  /**
   * @constructor
   *
   * @param {*} props
   */
  constructor(props) {
    super(props);

    this.state = {
      version: undefined,
      connected: socketHandler.connected,
    };

    this._restoreLocalSettings();
  }


  /**
   * @inheritdoc
   */
  componentWillMount = () => {
    this._bindEvents();
  }


  /**
   * @inheritdoc
   */
  componentDidMount = () => {
    window.addEventListener('beforeunload', this._handleNavigateAway);
  }


  /**
   * React: Component Will Unmount
   */
  componentWillUnmount = () => {
    this._unbindEvents();

    window.removeEventListener('beforeunload', this._handleNavigateAway);
  }


  /**
   * @type {boolean}
   */
  get initialised() {
    const {
      version,
    } = this.state;

    // Add logical conditions here to prevent the app from considering itself initialised
    return (
      !!version
    );
  }


  /**
   * @description
   * Some settings are be stored on the client so that their interface
   * resumes where it left off next time they load the page.
   * This method will restore those settings
   *
   * @TODO: populate this with local settings where required
   */
  _restoreLocalSettings = () => {
    // This is called prior to the component being loaded so we can't use setState();
    if (localSettings.get('someTestLocalSetting') !== undefined) {
      // eslint-disable-next-line react/destructuring-assignment
      this.state.someTestLocalSetting = localSettings.get('someTestLocalSetting');
    }

    const { someTestLocalSetting } = this.state;
    localSettings.set({ someTestLocalSetting });
  }


  /**
   * @description
   * Setup the event listeners
   */
  _bindEvents = () => {
    // Register the socket handler listeners
    socketHandler
      .on(CLIENT_SOCKET_HANDLER_EVENTS.MESSAGE, this._handleServerMessageReceived)
      .on(CLIENT_SOCKET_HANDLER_EVENTS.CONNECTED, this._handleSocketConnected)
      .on(CLIENT_SOCKET_HANDLER_EVENTS.DISCONNECTED, this._handleSocketDisconnected);
  }


  /**
   * @description
   * Tear down the event listeners
   */
  _unbindEvents = () => {
    // Unregister the socket handler listeners
    socketHandler
      .off(CLIENT_SOCKET_HANDLER_EVENTS.MESSAGE, this._handleServerMessageReceived)
      .off(CLIENT_SOCKET_HANDLER_EVENTS.CONNECTED, this._handleSocketConnected.bind(this))
      .off(CLIENT_SOCKET_HANDLER_EVENTS.DISCONNECTED, this._handleSocketDisconnected);
  }


  /**
   * @description
   * Fired when the client socket handler establishes a connection with the server
   */
  _handleSocketConnected = () => {
    console.log('Socket Connected');
    this.setState({ connected: true });
  }


  /**
   * @description
   * Fired when the client socket handler loses the connection with the server
   */
  _handleSocketDisconnected = () => {
    console.log('Socket Disconnected');
    this.setState({ connected: false });
  }


  /**
   * @description
   * Fired when the server sends a message to the client
   *
   * @param {string} message the SOCKET_MESSAGE received
   * @param {object|string|number} payload the payload from the server
   *                                      (specific to each message type)
   */
  _handleServerMessageReceived = (message, payload) => {
    const { version } = this.state;

    // TODO:
    switch (message) {
      case SERVER_SOCKET_MESSAGE.INITIALISE:
        // Check the version
        if (version !== undefined && version !== payload.version) {
          console.warn('Detected version discrepancy between client and server. Reloading page...');
          window.location.reload();
        }

        // TODO: deserialise the server state

        this.setState({
          version: payload.version,
        });
        break;
    }
  }


  /**
   * @description
   * Fired when the user begins navigating away from the page
   *
   * @param {*} event
   */
  _handleNavigateAway = (/* event */) => {
    // Nothing as of yet as we've moved the saving of the state to the LocalSettings singleton
  }


  /**
   * @inheritdoc
   */
  render() {
    const { connected } = this.state;

    return (
      <React.Fragment>
        <div>
          <h1>Main App</h1>
        </div>
        <div>
          <span>Connected: </span>
          <span>{connected ? 'true' : 'false'}</span>
        </div>
      </React.Fragment>
    );
  }
}

export default MainApp;
