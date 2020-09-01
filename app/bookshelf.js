const config = require('./config');
var fs = require('fs');
var knex = require('knex')({
  client: 'mysql',
  connection: {
    // debug    : true,
    host     : config.dbHost,
    user     : config.dbUser,
    password : config.dbPass,
    database : config.dbSchema,
    timezone: 'utc',
    ssl: {
      ca: fs.readFileSync(config.dbTlsCertAuthPath)
    }
  }
});

module.exports = require('bookshelf')(knex);
