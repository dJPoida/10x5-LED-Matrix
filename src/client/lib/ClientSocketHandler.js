import events from 'events';
import socketIOClient from 'socket.io-client';

import CLIENT_SOCKET_HANDLER_EVENTS from './constants/ClientSocketHandlerEvents';

// Singleton for the socket handler
let socketHandler;

/**
 * @class SocketHandler
 *
 * @description
 * A singleton class for managing communication between the client and the server
 */
class ClientSocketHandler extends events.EventEmitter {

  /**
  * @Constructor
  */
  constructor() {
    super();

    this._socket = undefined;
    this._connected = false;
    this._initialised = false;

    this.initialise();
  }


  /**
   * @description
   * Create a new instance of the client socket handler if one does not already exist
   *
   * @returns {ClientSocketHandler}
   */
  static getInstance = () => {
    if (!socketHandler) {
      socketHandler = new ClientSocketHandler();
      window.socketHandler = socketHandler;
    }

    return socketHandler;
  }


  get connected() { return this._connected; }

  get initialised() { return this._initialised; }


  /**
   * @description
   * Fired when the socket is connected to the server
   */
  _handleSocketConnected() {
    console.log('[SH] connected');
    this._connected = true;
    this.emit(CLIENT_SOCKET_HANDLER_EVENTS.CONNECTED);
  }


  /**
   * @description
   * Fired when the socket is disconnected
   */
  _handleSocketDisconnected() {
    console.log('[SH] disconnected');
    this._connected = false;
    this.emit(CLIENT_SOCKET_HANDLER_EVENTS.DISCONNECTED);
  }


  /**
   * @description
   * Fired when the client receives a message from the server
   *
   * @param { string } message the SERVER_SOCKET_MESSAGE received
   * @param { object | string | number } payload the payload from
   *        the server(specific to each message type)
   */
  _handleServerMessageReceived(message, payload) {
    this.emit(CLIENT_SOCKET_HANDLER_EVENTS.MESSAGE, message, payload);
  }


  /**
   * @description
   * Initialise the Socket Handler
   */
  initialise = () => {
    this._socket = socketIOClient({
      autoConnect: false,
    });

    this._socket.on('connect', this._handleSocketConnected);
    this._socket.on('disconnect', this._handleSocketDisconnected);
    this._socket.on('MSG', (message, payload) => {
      this._handleServerMessageReceived(message, payload);
    });

    // Push the connection of the socket to the server out of the current call stack
    setTimeout(() => {
      this._socket.connect();
    }, 0);

    this._initialised = true;
    this.emit(CLIENT_SOCKET_HANDLER_EVENTS.INITIALISED);
  }


  /**
   * @description
   * Send a message to the server via socket.io
   *
   * @param {string} message the SOCKET_MESSAGE type
   * @param {string|object|number} payload the payload to send to the server
   *        (conditional based on the message type)
   */
  sendMessageToServer(message, payload) {
    this._socket.emit('MESSAGE', message, payload);
  }
}

export default ClientSocketHandler.getInstance();
