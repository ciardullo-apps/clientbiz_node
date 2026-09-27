const config = require('./config');
var fs = require('fs');
var knex = require('knex')({
  client: 'mysql2',
  connection: {
    // debug    : true,
    host     : config.dbHost,
    user     : config.dbUser,
    password : config.dbPass,
    database : config.dbSchema,
    timezone: 'Z',
    ssl: {
      ca: fs.readFileSync(config.dbTlsCertAuthPath)
    }
  }
});

module.exports = require('bookshelf')(knex);
