const dotenv = require('dotenv');
dotenv.config({ path: './.env'});
module.exports = {
  nodeEnv: process.env.NODE_ENV,
  protocol: process.env.PROTOCOL,
  hostName: process.env.HOSTNAME,
  serverPort: process.env.PORT_BACKEND,
  clientPort: process.env.PORT_FRONTEND,
  context: process.env.CONTEXT,
  jwtKey: process.env.JWT_KEY,
  tlsKeyPath: process.env.TLS_KEY_PATH,
  tlsCertPath: process.env.TLS_CERT_PATH,
  tlsCertAuthPath: process.env.TLS_CERT_AUTH_PATH,
  userId: process.env.USER_ID,
  userEmail: process.env.USER_EMAIL,
  dbHost: process.env.DB_HOST,
  dbTlsCertAuthPath: process.env.DB_TLS_CERT_AUTH_PATH,
  dbSchema: process.env.DB_SCHEMA,
  dbUser: process.env.DB_USER,
  dbPass: process.env.DB_PASS,
  passportStrategy: process.env.PASSPORT_STRATEGY
};
