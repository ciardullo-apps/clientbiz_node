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

  var query = connection.query('SELECT id, firstname, lastname, contactname, timezone, solicited, numappts, lastapptdate FROM clientview ORDER BY lastapptyearmonth desc, numappts desc');
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
        'id': row.id,
        'firstname': row.firstname,
        'lastname': row.lastname,
        'contactname': row.contactname,
        'timezone': row.timezone,
        'solicited': row.solicited,
        'numappts': row.numappts,
        'lastapptdate': (row.lastapptdate ? row.lastapptdate.toJSON().slice(0,10) : "")
      });
    })
    .on('end', function() {
      // all rows have been received
      var jsonMessage = {
        'clients': clients
      }
      response.json(clients);
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
      // 'id': row.id.toString(),
      topics.push ({
        'id': row.id,
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

app.get('/receivables', function(request, response) {
  let clientId = request.params['clientId'];
  var connection = getConnection();
  connection.connect();

  var receivables = new Array();

  var query = connection.query('SELECT a.id, firstname, lastname, t.name, starttime, duration, rate, billingpct, paid FROM ' + APPOINTMENT_TABLE + ' a JOIN clientele c on a.client_id = c.id JOIN topic t on a.topic_id = t.id WHERE paid is null order by starttime');
  query
    .on('error', function(err) {
      // Handle error, an 'end' event will be emitted after this as well
      console.log(err);
    })
    .on('fields', function(fields) {
      // the field packets for the rows to follow
    })
    .on('result', function(row) {
      receivables.push ({
        'appointment_id': row.id,
        'firstname': row.firstname,
        'lastname': row.lastname,
        'topicname': row.name,
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
        'receivables': receivables
      }
      response.json(jsonMessage);
    });

  connection.end();
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

app.post('/updateAppointment', function(request, response) {
  var connection = getConnection();
  connection.connect();

  // JSON elements must match table column names
  connection.query('UPDATE ' + APPOINTMENT_TABLE + ' SET paid = ? WHERE id = ?', [ request.body['paid'], request.body['id'] ], function (error, results, fields) {
    if (error) throw error;
    console.log(results.changedRows);
    response.json({ 'rowsAffected': results.changedRows });
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
