import React from 'react';
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
      fps: 0,
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

    clientSocketHandler.clientRole = CLIENT_ROLE.EMULATOR;
    clientSocketHandler.connect();

    this.fpsUpdateInterval = setInterval(this._calculateFPS, 1000);
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
   * Bind the event listeners this class cares about
   */
  _bindEvents = () => {
    clientSocketHandler.on(CLIENT_SOCKET_HANDLER_EVENTS.MESSAGE, this._handleClientSocketHandlerMessage);
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
   * React: Render
   */
  render() {
    const { fps } = this.state;
    return (
      <div className="app emulator">
        <div className="connectivity">
          <div className="indicator disconnected" />
          <div className="fps">
            <span ref={this.fpsIndicatorRef}>{`${fps} fps`}</span>
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
