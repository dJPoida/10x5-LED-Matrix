import React from 'react';
import EmulatedLEDMatrix from '../../components/EmulatedLEDMatrix';
import clientSocketHandler from '../../lib/ClientSocketHandler';

import CLIENT_ROLE from '../../../lib/constants/ClientRole';

class EmulatorApp extends React.Component {

  /**
   * @constructor
   */
  constructor(props) {
    super(props);

    this.state = {};
  }


  /**
   * @inheritdoc
   */
  componentDidMount = () => {
    clientSocketHandler.clientRole = CLIENT_ROLE.EMULATOR;
    clientSocketHandler.connect();
  }


  /**
   * React: Render
   */
  render() {
    return (
      <div className="app emulator">
        <EmulatedLEDMatrix />
      </div>
    );
  }
}

export default EmulatorApp;
