var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

app.listen(8080);

console.log('Application listening on port 8080');


var mysql      = require('mysql');

// Routes
app.get('/client', function(request, response) {
  var connection = getConnection();
  connection.connect();

  var clients = new Array();

  var query = connection.query('SELECT id, firstname, lastname FROM clientele ORDER BY firstresponse desc, firstname, lastname');
  query
    .on('error', function(err) {
      // Handle error, an 'end' event will be emitted after this as well
      console.log(err);
    })
    .on('fields', function(fields) {
      // the field packets for the rows to follow
    })
    .on('result', function(row) {
      clients.push ({
        'clientId': row.id,
        'firstname': row.firstname
      });
    })
    .on('end', function() {
      // all rows have been received
      var jsonMessage = {
        'clients': clients
      }
      response.json(jsonMessage);
    });

  connection.end();
});

app.get('/client/:clientId', function(request, response) {
  let clientId = request.params['clientId'];
  var connection = getConnection();
  connection.connect();

  var client = null;

  var query = connection.query('SELECT id, firstname, lastname, contactname, city, state, timezone, firstcontact, firstresponse, solicited FROM clientele WHERE id = ' + clientId);
  query
    .on('error', function(err) {
      // Handle error, an 'end' event will be emitted after this as well
      console.log(err);
    })
    .on('fields', function(fields) {
      // the field packets for the rows to follow
    })
    .on('result', function(row) {
      client = {
        'clientId': row.id,
        'firstname': row.firstname,
        'lastname': row.lastname,
        'contactname': row.contactname,
        'city': row.city,
        'state': row.state,
        'timezone': row.timezone,
        'firstcontact': row.firstcontact,
        'firstresponse': row.firstresponse,
        'solicited': row.solicited
      };
    })
    .on('end', function() {
      // all rows have been received
      var jsonMessage = {
        'client': client
      }
      response.json(jsonMessage);
    });

  connection.end();
});

app.get('/appointments/:clientId', function(request, response) {
  let clientId = request.params['clientId'];
  var connection = getConnection();
  connection.connect();

  var appointments = new Array();

  var query = connection.query('SELECT id, client_id, topic_id, starttime, duration, rate, billingpct, paid FROM appointment WHERE client_id = ' + clientId);
  query
    .on('error', function(err) {
      // Handle error, an 'end' event will be emitted after this as well
      console.log(err);
    })
    .on('fields', function(fields) {
      // the field packets for the rows to follow
    })
    .on('result', function(row) {
      appointments.push ({
        'appointmentId': row.id,
        'clientId': row.client_id,
        'topicId': row.topic_id,
        'startTime': row.starttime,
        'duration': row.duration,
        'rate': row.rate,
        'billingPct': row.billingpct,
        'datePaid': row.paid
      });
    })
    .on('end', function() {
      // all rows have been received
      var jsonMessage = {
        'appointments': appointments
      }
      response.json(jsonMessage);
    });

  connection.end();
});

app.get('/', function(request, response) {
  // load the single view file (angular will handle the page changes on the front-end)

  response.sendfile('./public/index.html');
});

function getConnection() {
  return mysql.createConnection({
    host     : 'localhost',
    user     : 'john',
    password : 'test',
    database : 'clientbiz',
    timezone: 'Z'
  });
}
