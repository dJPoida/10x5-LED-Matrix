import React from 'react';
import classNames from 'classnames';
import Switch from 'react-switch';

import EmulatedLEDMatrix from '../../components/EmulatedLEDMatrix';
import clientSocketHandler from '../../lib/ClientSocketHandler';

import CLIENT_ROLE from '../../../lib/constants/ClientRole';
import SERVER_SOCKET_MESSAGE from '../../../lib/constants/ServerSocketMessage';
import CLIENT_SOCKET_HANDLER_EVENTS from '../../lib/constants/ClientSocketHandlerEvents';

class EmulatorApp extends React.Component {

  /**
   * @constructor
   */
  constructor(props) {
    super(props);

    this.state = {
      emulate: false,
      fps: 0,
      connected: clientSocketHandler.connected,
    };

    this.framesReceived = 0;
    this.fpsIndicatorRef = React.createRef();
    this.fpsUpdateInterval = undefined;
  }


  /**
   * @inheritdoc
   */
  componentDidMount = () => {
    this._bindEvents();

    this.fpsUpdateInterval = setInterval(this._calculateFPS, 1000);

    clientSocketHandler.clientRole = CLIENT_ROLE.EMULATOR;
    this.emulate(true);
  }


  /**
   * @description
   * Fired whenever a message is received from the socket handler
   *
   * @param {SERVER_SOCKET_MESSAGE} message
   */
  _handleClientSocketHandlerMessage = (message) => {
    switch (message) {
      case SERVER_SOCKET_MESSAGE.EMULATOR_FRAME:
        this.framesReceived += 1;
        break;
    }
  }


  /**
   * @description
   * Fired whenever the socket handler connects
   */
  _handleSocketHandlerConnected = () => {
    this.setState({ connected: true });
  }


  /**
   * @description
   * Fired whenever the socket handler disconnects
   */
  _handleSocketHandlerDisconnected = () => {
    this.setState({ connected: false });
  }


  /**
   * @description
   * Fired whenever the user toggles the emulate switch
   */
  _handleChangeEmulateSwitch = (checked) => {
    this.emulate(checked);
  }


  /**
   * @description
   * Bind the event listeners this class cares about
   */
  _bindEvents = () => {
    clientSocketHandler
      .on(CLIENT_SOCKET_HANDLER_EVENTS.MESSAGE, this._handleClientSocketHandlerMessage)
      .on(CLIENT_SOCKET_HANDLER_EVENTS.CONNECTED, this._handleSocketHandlerConnected)
      .on(CLIENT_SOCKET_HANDLER_EVENTS.DISCONNECTED, this._handleSocketHandlerDisconnected);
  }


  /**
   * @description
   * Fired once every second to update the state based on the number of frames received
   */
  _calculateFPS = () => {
    const newFPS = this.framesReceived;
    this.framesReceived = 0;
    this.setState({
      fps: newFPS,
    });
  }


  /**
   * @description
   * Connect to the device to begin emulation
   *
   * @param {boolean} emulate whether to connect or disconnect
   */
  emulate = (emulate) => {
    if (emulate && !clientSocketHandler.connected) {
      this.setState({ emulate }, () => {
        clientSocketHandler.connect();
      });
    } else if (!emulate && clientSocketHandler.connected) {
      this.setState({ emulate }, () => {
        clientSocketHandler.disconnect();
      });
    }
  }


  /**
   * React: Render
   */
  render() {
    const { emulate, fps, connected } = this.state;

    return (
      <div className="app emulator">
        <div className="connectivity">
          <div className="left">
            <Switch onChange={this._handleChangeEmulateSwitch} checked={emulate} />
            <div className={classNames('indicator', { 'disconnected': !connected, 'connected': connected })} />
            <div>
              <span>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="fps">
              <span ref={this.fpsIndicatorRef}>{`${fps} fps`}</span>
            </div>
          </div>
          <div className="right">
            <div className="app-title">
              {/* TODO: put the app title and version details here */}
              <span>LED Matrix</span>
            </div>
            <img className="app-icon" src="/img/icons/icon-512x512.png" alt="LED Matrix" />
          </div>
        </div>
        <div className="emulator-wrapper">
          <EmulatedLEDMatrix />
        </div>
      </div>
    );
  }
}

export default EmulatorApp;
