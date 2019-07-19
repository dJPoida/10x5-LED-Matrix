// Messages from the Server to the Client
const SERVER_SOCKET_MESSAGE = {
  // Force the client to initialise itself (usually after connection);
  INITIALISE: 'I',

  // Update the emulator with new frame data
  EMULATOR_FRAME: 'F',
};

module.exports = SERVER_SOCKET_MESSAGE;
