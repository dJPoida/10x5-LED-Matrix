const EventEmitter = require('events');
const socketIo = require('socket.io');

const SERVER_SOCKET_HANDLER_EVENTS = require('./constants/ServerSocketHandlerEvents');
const KERNEL_EVENTS = require('../../lib/constants/KernelEvents');
const SOCKET_ROOMS = require('./constants/SocketRooms');
const SERVER_SOCKET_MESSAGE = require('../../lib/constants/ServerSocketMessage');
const CLIENT_SOCKET_MESSAGE = require('../../lib/constants/ClientSocketMessage');
const CLIENT_ROLE = require('../../lib/constants/ClientRole');

/**
 * @class ServerSocketHandler
 *
 * @description
 * Controls the sending and receiving of information from and to the connected clients
 * over sockets
 */
class ServerSocketHandler extends EventEmitter
{
  /**
   * @constructor
   *
   * @param {Kernel} kernel
   */
  constructor(kernel) {
    super();

    this._kernel = kernel;
    this._connectedClients = 0;
    this._emulatorClients = 0;
    this._io = socketIo(kernel.http);

    this._bindEvents();
  }


  /**
   * @type {Kernel}
   */
  get kernel() { return this._kernel; }


  /**
   * @type {socketIo}
   */
  get io() { return this._io; }


  /**
   * @type {number}
   */
  get connectedClients() { return this._connectedClients; }


  /**
   * @type {number}
   */
  get emulatorClients() { return this._emulatorClients; }


  /**
   * @description
   * Bind the event listeners this class cares about
   */
  _bindEvents() {
    this.once(SERVER_SOCKET_HANDLER_EVENTS.INITIALISED, this._handleInitialised.bind(this));

    // Listen for frame updates and broadcast them to any connected emulators
    this.kernel.on(KERNEL_EVENTS.FRAME_UPDATE, this._handleFrameUpdated.bind(this));

    this.io.on('connection', this._handleSocketConnected.bind(this));
  }


  /**
   * @description
   * Fired when the Server Socket Handler is initialised
   */
  _handleInitialised() {
    console.log('Server Socket Handler Initialised.');
  }


  /**
   * @description
   * Fired by the Kernel when the frame data is updated. If we have any connected emulators we
   * can use this to push out the pixel data to them.
   * @param {object} frame
   */
  _handleFrameUpdated(frame) {
    if (this.emulatorClients > 0) {
      this.sendMessageToClients(SERVER_SOCKET_MESSAGE.EMULATOR_FRAME, { pixelData: frame.pixelData });
    }
  }


  /**
   * @description
   * Fired when a client socket connection is established
   *
   * @param socket socket
   * @returns {void}
   */
  _handleSocketConnected(socket) {
    console.log('Socket Connected. Awaiting identification...');

    // Start by flagging the socket as an unknown
    socket.clientRole = CLIENT_ROLE.UNIDENTIFIED;

    // Create a temporary handler for this socket until they identify who / what they are
    socket.on('disconnect', reason => this._handleSocketDisconnected(socket, reason));
    socket.once('ID', clientRole => this._handleSocketIdentityReceived(socket, clientRole));

    // Emit an identity request
    socket.emit('ID');

    // Setup a timeout to terminate the connection if we don't hear from them in 3 seconds.
    socket.identityTimeout = setTimeout(() => {
      console.log('Socket Identity not verified. Booting.');
      clearTimeout(socket.identityTimeout);
      socket.emit('MSG', 'No identity provided in the allotted time. Goodbye.');
      socket.disconnect();
    }, 3000);
  }


  /**
   * @description
   * Fired when an incoming socket attempts to identify itself.
   *
   * @param {Socket} socket
   * @param {CLIENT_ROLE} clientRole
   */
  _handleSocketIdentityReceived(socket, clientRole) {
    // Clear the identity timeout on the socket
    clearTimeout(socket.identityTimeout);

    // TODO: at some point in the future add some auth here

    // Ensure the role is valid
    if (!Object.values(CLIENT_ROLE).includes(clientRole)) {
      console.log(`Invalid client role "${clientRole}" provided. Booting.`);
      socket.emit('MSG', 'Invalid client role provided. Goodbye.');
      socket.disconnect();
      return;
    }

    // Keep track of the connected client
    this._connectedClients += 1;

    // We use this to determine if we need to pump out the frame data
    if (clientRole === CLIENT_ROLE.EMULATOR) {
      this._emulatorClients += 1;
    }

    console.log(`Socket Identified as "${clientRole}".`, { connectedClients: this.connectedClients });
    socket.clientRole = clientRole;

    // Join the socket to the appropriate rooms
    socket.join(SOCKET_ROOMS.GLOBAL);
    if (socket.clientRole === CLIENT_ROLE.EMULATOR) {
      socket.join(SOCKET_ROOMS.EMULATOR);
    }
    if (socket.clientRole === CLIENT_ROLE.MAIN) {
      socket.join(SOCKET_ROOMS.MAIN);
    }

    // If everything else checks out - setup the rest of the socket handler stuff
    socket.on('MSG', this._handleClientMessageReceived.bind(this));

    // Notify any listeners of this class that a client has connected
    this.emit(SERVER_SOCKET_HANDLER_EVENTS.CLIENT_CONNECTED, { socket, connectedClients: this.connectedClients });

    // Send an initial server state to the client
    setTimeout(() => {
      // Send any initialisation required for all clients
      this.kernel.serializeState(clientRole === CLIENT_ROLE.EMULATOR).then(
        serverState => this.sendMessageToClients(SERVER_SOCKET_MESSAGE.INITIALISE, serverState, null, socket),
      );
    }, 0);
  }


  /**
   * @description
   * Fired when a client socket is disconnected
   *
   * @param {Socket} socket the socket that was disconnected
   * @param {string} disconnectReason the reason for disconnection
   *
   * @returns {void}
   */
  _handleSocketDisconnected(socket, disconnectReason) {
    if (socket.clientRole !== CLIENT_ROLE.UNIDENTIFIED) {
      this._connectedClients -= 1;

      if (socket.clientRole === CLIENT_ROLE.EMULATOR) {
        this._emulatorClients -= 1;
      }

      console.log(`Client disconnected: "${disconnectReason}"`, { connectedClients: this.connectedClients });
    } else {
      console.log('Unidentified client disconnected');
    }


    // Notify any listeners of this class that a socket has disconnected
    this.emit(SERVER_SOCKET_HANDLER_EVENTS.CLIENT_DISCONNECTED, { connectedClients: this.connectedClients });
  }


  /**
   * @description
   * Fired when a message is received from a connected client
   *
   * @param {string} message
   * @param {object} payload
   * @returns {void}
   */
  _handleClientMessageReceived(message, payload) {
    switch (message) {
      case CLIENT_SOCKET_MESSAGE.TEST:
        console.log('Test Message received from the client loud and clear!');
        break;

      default:
        console.warn(`Unhandled client socket message: ${message}`, { payload });
        break;
    }

    this.emit(SERVER_SOCKET_HANDLER_EVENTS.CLIENT_MESSAGE_RECEIVED, { message, payload });
  }


  /**
   * @description
   * Initialise the Server Socket Handler
   */
  async initialise() {
    console.log('Server Socket Handler initialising...');

    // Let everyone know that the Socket Handler is initialised
    this.emit(SERVER_SOCKET_HANDLER_EVENTS.INITIALISED);
  }


  /**
   * @description
   * Send a message to a specific socket or to everyone
   *
   * @param {string} message
   * @param {object} payload
   * @param {string | string[]} [rooms=[]]
   * @param {object} [socket=undefined]
   */
  sendMessageToClients(message, payload, rooms = [], socket) {
    const self = this;

    if (typeof rooms === 'string') {
      rooms = [rooms];
    }

    // Emit to a specific socket
    if (typeof (socket) !== 'undefined') {
      socket.emit('MSG', message, payload);
    }

    // Emit to one or more rooms
    else if (Array.isArray(rooms) && (rooms.length > 0)) {
      rooms.forEach(room => socket.to(room).emit(message, payload));
    }

    // Emit to everyone
    else {
      self.io.emit('MSG', message, payload);
    }
  }
}

module.exports = ServerSocketHandler;
