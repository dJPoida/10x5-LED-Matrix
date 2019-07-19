// Roles that a client can perform.
// Typically used to identify a client when connecting to the server
const CLIENT_ROLE = {
  // The client has not identified itself or is unknown
  UNIDENTIFIED: 'unidentified',

  // The client is the main control app
  MAIN: 'main',

  // The client is an LED Matrix Emulator
  EMULATOR: 'emulator',
};

module.exports = CLIENT_ROLE;
