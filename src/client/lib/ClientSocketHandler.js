import events from 'events';
import socketIOClient from 'socket.io-client';

import CLIENT_SOCKET_HANDLER_EVENTS from './constants/ClientSocketHandlerEvents';
import CLIENT_ROLE from '../../lib/constants/ClientRole';

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

    this._socket = null;
    this._connected = false;
    this._initialised = false;
    this._clientRole = null;

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


  /**
   * @description
   * Whether the socket is currently connected
   *
   * @type {boolean}
   */
  get connected() { return this._connected; }

  /**
   * @description
   * Whether the socket handler is initialised
   *
   * @type {boolean}
   */
  get initialised() { return this._initialised; }

  /**
   * @description
   * This role is used when connecting to the server to ensure the server sends the appropriate messages
   *
   * @type {CLIENT_ROLE | null}
   */
  get clientRole() { return this._clientRole; }

  set clientRole(value) {
    if (!Object.values(CLIENT_ROLE).includes(value)) {
      throw new TypeError(`Invalid clientRole "${value}" provided. Must be one of [${Object.keys(CLIENT_ROLE).join(', ')}]`);
    }

    const reconnectRequired = (value !== this._clientRole);
    this._clientRole = value;
    if (reconnectRequired) {
      this.connect();
    }
  }


  /**
   * @description
   * Fired when the client socket handler recieves an identity request
   */
  _handleSocketIdentityRequest = () => {
    console.log('[CSH] identity request');
    if (this.clientRole) {
      this._socket.emit('ID', this.clientRole);
    } else {
      console.warn('[CSH] No clientSocketHandler.clientRole has been set!');
    }
  }


  /**
   * @description
   * Fired when the socket is connected to the server
   */
  _handleSocketConnected = () => {
    console.log('[CSH] connected');
    this._connected = true;
    this.emit(CLIENT_SOCKET_HANDLER_EVENTS.CONNECTED);
  }


  /**
   * @description
   * Fired when the socket is disconnected
   */
  _handleSocketDisconnected = () => {
    console.log('[CSH] disconnected');
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
  _handleServerMessageReceived = (message, payload) => {
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
    this._socket.on('ID', this._handleSocketIdentityRequest);
    this._socket.on('MSG', (message, payload) => {
      this._handleServerMessageReceived(message, payload);
    });

    this._initialised = true;
    this.emit(CLIENT_SOCKET_HANDLER_EVENTS.INITIALISED);
  }


  /**
   * @description
   */
  connect = () => {
    if (this._socket.connected) {
      this._socket.disconnect();
    }

    // Push the connection of the socket to the server out of the current call stack
    setTimeout(() => {
      console.log('[CSH] connect');
      this._socket.connect();
    }, 0);
  }


  /**
   * @description
   * Send a message to the server via socket.io
   *
   * @param {string} message the SOCKET_MESSAGE type
   * @param {string|object|number} payload the payload to send to the server
   *        (conditional based on the message type)
   */
  sendMessageToServer = (message, payload) => {
    this._socket.emit('MESSAGE', message, payload);
  }
}

export default ClientSocketHandler.getInstance();
