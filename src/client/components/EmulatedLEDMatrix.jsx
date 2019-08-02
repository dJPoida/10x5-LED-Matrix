import React from 'react';

import clientSocketHandler from '../lib/ClientSocketHandler';
import int2rgb from '../../lib/helpers/int2rgb';

import SERVER_SOCKET_MESSAGE from '../../lib/constants/ServerSocketMessage';
import CLIENT_SOCKET_HANDLER_EVENTS from '../lib/constants/ClientSocketHandlerEvents';

/**
 * @class EmulatedLEDMatrix
 *
 * @description
 * Renders out an LED Matrix that looks just like the real thing
 *
 * @todo: Ensure we flush the matrix whenever the width and height of the device changes
 */
class EmulatedLEDMatrix extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      width: null,
      height: null,
      containerWidth: null,
      containerHeight: null,
      pixelSize: null,
      initialised: false,
      matrix: [],
      pixelRefs: [],
    };

    this.containerRef = React.createRef();
  }


  /**
   * @inheritdoc
   */
  componentWillMount() {
    this._bindEvents();
  }


  /**
   * @inheritdoc
   */
  componentDidMount() {
    this._updateContainerSize();
  }


  /**
   * @description
   * Handle changes to the state which may require re-initialisation of the LED Matrix
   *
   * @param {object} newProps
   * @param {object} newState
   */
  shouldComponentUpdate(newProps, newState) {
    let allowRender = true;

    const {
      width,
      height,
      containerWidth,
      containerHeight,
    } = this.state;

    const {
      width: newWidth,
      height: newHeight,
      containerWidth: newContainerWidth,
      containerHeight: newContainerHeight,
    } = newState;

    const containerChanged = (containerWidth !== newContainerWidth) || (containerHeight !== newContainerHeight);
    const matrixChanged = (width !== newWidth) || (height !== newHeight);

    // If either of the width or height has changed, we need to re-generate the matrix
    if (matrixChanged) {
      this._extrapolateMatrix(newWidth, newHeight);
      allowRender = false;
    }

    if (matrixChanged || containerChanged) {
      this._updatePixelSize(newContainerWidth, newContainerHeight, newWidth, newHeight);
      allowRender = false;
    }

    return allowRender;
  }


  /**
   * @inheritdoc
   */
  componentWillUnmount = () => {
    this._unbindEvents();
  }


  /**
   * @description
   * Determines the client width and height of the LED Matrix Emulator client space and updates the state if required
   */
  _updateContainerSize = () => {
    const { containerWidth, containerHeight } = this.state;
    let { containerWidth: newContainerWidth, containerHeight: newContainerHeight } = this.state;

    if (this.containerRef.current) {
      newContainerWidth = this.containerRef.current.clientWidth;
      newContainerHeight = this.containerRef.current.clientHeight;
    }

    if (containerWidth !== newContainerWidth || containerHeight !== newContainerHeight) {
      this.setState({
        containerWidth: newContainerWidth,
        containerHeight: newContainerHeight,
      });
    }
  }


  /**
   * @description
   * Bind the events required to run the component
   */
  _bindEvents = () => {
    clientSocketHandler
      .on(CLIENT_SOCKET_HANDLER_EVENTS.MESSAGE, this._handleClientSocketHandlerMessage);

    window.addEventListener('resize', this._updateContainerSize);
  }


  /**
   * @description
   * Unbind the events required to run the component
   */
  _unbindEvents = () => {
    window.removeEventListener('resize', this._updateContainerSize);

    clientSocketHandler
      .off(CLIENT_SOCKET_HANDLER_EVENTS.MESSAGE, this._handleClientSocketHandlerMessage);
  }


  /**
   * @description
   * Fired when a socket message comes from the server to update the emulator frame data
   *
   * @param {Uint32Array} pixelData
   */
  _handleUpdateEmulatorFrame = (pixelData) => {
    if (Array.isArray(pixelData)) {
      const { pixelRefs } = this.state;
      pixelData.forEach((pixel, index) => {
        if ((typeof pixelRefs[index] !== 'undefined') && pixelRefs[index].current) {
          const rgb = int2rgb(pixel);
          pixelRefs[index].current.style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }
      });
    }
  }


  /**
   * @description
   * Fired when the initialisation message comes in after initial connection to the server
   *
   * @param {object} initialState the data from the server provided upon connection
   */
  _handleInitialise = (initialState) => {
    this.setState({
      initialised: true,
      width: initialState.ledDevice.width,
      height: initialState.ledDevice.height,
    });
  }


  /**
   * @description
   * Fired whenever a message is received from the socket handler
   */
  _handleClientSocketHandlerMessage = (message, payload) => {
    switch (message) {
      case SERVER_SOCKET_MESSAGE.INITIALISE:
        this._handleInitialise(payload);
        break;

      case SERVER_SOCKET_MESSAGE.EMULATOR_FRAME:
        this._handleUpdateEmulatorFrame(payload.pixelData);
        break;
    }
  }


  /**
   * @description
   * Calculates the ideal size (width / height) of a pixel to fit inside the container size
   */
  _updatePixelSize = (containerWidth, containerHeight, width, height) => {
    const { pixelSize } = this.state;

    // How what is the maximum pixel width?
    const maxPixelWidth = (containerWidth * 0.95) / width;

    // what is the maximum pixel height
    const maxPixelHeight = (containerHeight * 0.95) / height;

    // The pixel size is the smaller of the two
    const newPixelSize = Math.round(Math.min(maxPixelWidth, maxPixelHeight));

    if (newPixelSize !== pixelSize) {
      this.setState({
        pixelSize: newPixelSize,
      });
    }
  }


  /**
   * @description
   * Extrapolate the internal matrix used for rendering by multiplying the
   * width and the height. Also creates the React references required for
   * updating the DOM elements.
   *
   * @param {number} width
   * @param {number} height
   */
  _extrapolateMatrix(width, height) {
    const newMatrix = [];
    for (let y = 0; y < height; y += 1) {
      const row = [];
      // Iterate over the columns
      for (let x = 0; x < width; x += 1) {
        row.push(y * width + x);
      }
      newMatrix.push(row);
    }

    // Keep an array of refs to the pixels for faster updating than re-rendering the dom
    const newPixelRefs = [];
    for (let i = 0; i < (height * width); i += 1) {
      newPixelRefs.push(React.createRef());
    }

    this.setState({
      matrix: newMatrix,
      pixelRefs: newPixelRefs,
    });
  }


  /**
   * @inheritdoc
   */
  render() {
    const {
      initialised, matrix, pixelRefs, pixelSize,
    } = this.state;

    return (
      <div className="emulated-led-matrix" ref={this.containerRef}>
        <div className="device-wrapper">
          {initialised && (
            <div className="device">
              {matrix.map((row, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="device-row">
                  {row.map(pixel => (
                    <div className="pixel-wrapper" key={pixel}>
                      <div
                        ref={pixelRefs[pixel]}
                        className="device-pixel"
                        id={`pixel_${pixel}`}
                        style={{
                          width: pixelSize,
                          height: pixelSize,
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default EmulatedLEDMatrix;
