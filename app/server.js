var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.listen(8080);

console.log('Application listening on port 8080');

var mysql = require('mysql');

const APPOINTMENT_TABLE = 'appointment';

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

app.get('/topics', function(request, response) {
  var connection = getConnection();
  connection.connect();

  var topics = new Array();

  var topicQuery = connection.query('SELECT id, name FROM topic ORDER BY id');
  topicQuery
    .on('error', function(err) {
      // Handle error, an 'end' event will be emitted after this as well
      console.log(err);
    })
    .on('fields', function(fields) {
      // the field packets for the rows to follow
    })
    .on('result', function(row) {
      // Need to convert row.id toString to support ng-options in appointment-detail
      topics.push ({
        'topicId': row.id.toString(),
        'topicName': row.name
      });
    })
    .on('end', function() {
      // all rows have been received
      var jsonMessage = {
        'topics': topics
      }
      response.json(jsonMessage);
    });

  connection.end();
});

app.get('/client/:clientId', function(request, response) {
  var clientId = request.params['clientId'];
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
        'firstcontact': (row.firstcontact ? row.firstcontact.toLocaleString("en-US") : ''),
        'firstresponse': row.firstresponse.toLocaleString("en-US"),
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

  var query = connection.query('SELECT id, client_id, topic_id, starttime, duration, rate, billingpct, paid FROM ' + APPOINTMENT_TABLE + ' WHERE client_id = ' + clientId);
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
        'appointment_id': row.id,
        'client_id': row.client_id,
        'topic_id': row.topic_id,
        'starttime': row.starttime.toLocaleString("en-US"),
        'duration': row.duration,
        'rate': row.rate,
        'billingpct': row.billingpct,
        'paid': (row.paid ? row.paid.toLocaleDateString("en-US") : ''),
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

app.post('/saveAppointment', function(request, response) {
  var connection = getConnection();
  connection.connect();

  // JSON elements must match table column names
  connection.query('INSERT INTO ' + APPOINTMENT_TABLE + ' SET ?', request.body, function (error, results, fields) {
    if (error) throw error;
    console.log(results.insertId);
    response.json({ 'appointmentId': results.insertId });
    response.status(200).end();
  });

});

function getConnection() {
  return mysql.createConnection({
    host     : 'localhost',
    user     : 'john',
    password : 'test',
    database : 'clientbiz',
    timezone: 'local'
  });
}
