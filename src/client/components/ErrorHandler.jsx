import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorHandler extends Component {
  /**
   * @constructor
   */
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }


  /**
   * @description
   * Reload the application
   */
  reloadApplication = () => {
    window.location.reload();
  }


  /**
   * @inheritdoc
   */
  componentDidCatch(error, info) {
    this.setState({ hasError: true, error, info });
  }


  /**
   * Render
   */
  render() {
    const { children } = this.props;
    const { hasError, error, info } = this.state;

    if (hasError) {
      console.error('Application crashed', { error, info });
      return (
        <div className="error-handler">
          <h1>Application Crashed</h1>
          <p>Unfortunately an unexpected error has occurred. We apologise for the inconvenience.</p>
          <p>Please click below to reload</p>
          <button type="button" onClick={this.reloadApplication} />
        </div>
      );
    }

    return children;
  }
}

ErrorHandler.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorHandler;
