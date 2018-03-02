// In a file named something like bookshelf.js
var knex = require('knex')({
  client: 'mysql',
  connection: {
    // debug    : true,
    host     : 'localhost',
    user     : 'john',
    password : 'test',
    database : 'clientbiz',
    timezone: 'utc'
  }
});

module.exports = require('bookshelf')(knex);
