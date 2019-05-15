var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var knex = require('knex');
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.listen(8080);

console.log('Application listening on port 8080');

var bookshelf = require('./bookshelf');

// Relations
var Topic = bookshelf.Model.extend({
  tableName: 'topic',
  appointments: function() {
    return this.belongsTo(Appointment, 'topic_id')
  }
});

var Clientele = bookshelf.Model.extend({
  tableName: 'clientele',
  appointments: function() {
    return this.belongsTo(Appointment, 'client_id');
  }
});

var ClientView = bookshelf.Model.extend({
  tableName: 'clientview'
});

var Appointment = bookshelf.Model.extend({
  tableName: 'appointment',
  client: function() {
    return this.hasOne(Clientele, 'id', 'client_id');
  },
  topic: function() {
    return this.hasOne(Topic, 'id', 'topic_id');
  }
  // constructor: function() {
  //   bookshelf.Model.apply(this, arguments);
  //   this.on("updated", function(model, affectedRows, options) {
  //     throw "Too many rows updated";
  //   })
  // }
});

var ClientTopic = bookshelf.Model.extend({
  tableName: 'clienttopic'
});


// Routes
app.get('/client', function(request, response) {
  var sortColumn = request.query['sortColumn'];
  var sortOrder = request.query['sortOrder'];

  if (!sortColumn) {
    sortColumn = 'lastapptdate';
  }

  if (!sortOrder) {
    sortOrder = 'desc';
  }

  var clients = new Array();

  new ClientView()
  .orderBy(sortColumn, sortOrder)
  .fetchAll().then(function(rows) {
    rows.forEach(function (model) {
      clients.push ({
        'id': model.get('id'),
        'firstname': model.get('firstname'),
        'lastname': model.get('lastname'),
        'contactname': model.get('contactname'),
        'timezone': model.get('timezone'),
        'solicited': model.get('solicited'),
        'numappts': model.get('numappts'),
        'revenue': model.get('revenue'),
        'lastapptdate': (model.get('lastapptdate') ? model.get('lastapptdate').toJSON().slice(0,10) : "")
      });
    });
    response.json(clients);
    response.status(200).end();
    // response.json(rows.serialize());
  })
  .catch(function(error) {
    console.error(error);
  });
});

app.get('/client/:clientId', function(request, response) {
  var clientId = request.params['clientId'];

  var client = { };

  new Clientele().where('id', clientId)
    .fetch()
    .then(function(model) {
        client.clientId =  model.get('id');
        client.firstname = model.get('firstname');
        client.lastname = model.get('lastname');
        client.contactname = model.get('contactname');
        client.city = model.get('city');
        client.state = model.get('state');
        client.timezone = model.get('timezone');
        client.firstcontact = (model.get('firstcontact') ? model.get('firstcontact').toJSON().slice(0,16) : '');
        client.firstresponse = model.get('firstresponse').toJSON().slice(0,16);
        client.solicited = model.get('solicited');

        response.json(client);
        response.status(200).end();
        // response.json(rows.serialize());
    })
    .catch(function(error) {
      console.error(error);
    });
});

app.get('/appointments/:clientId', function(request, response) {
  let clientId = request.params['clientId'];

  var appointments = new Array();

  new Appointment()
    .where('client_id', clientId)
    .orderBy('starttime', 'ASC')
    .fetchAll().then(function(rows) {
      rows.forEach(function (model) {
        appointments.push ({
          'id': model.get('id'),
          'client_id': model.get('client_id'),
          'topic_id': model.get('topic_id'),
          'starttime': model.get('starttime'),
          'duration': model.get('duration'),
          'rate': model.get('rate'),
          'billingpct': model.get('billingpct'),
          'paid': model.get('paid'),
          'description': model.get('description')
        });
      });
      response.json(appointments);
      response.status(200).end();
    })
    .catch(function(error) {
      console.error(error);
    });

});

app.get('/topics', function(request, response) {
  var topics = new Array();

  new Topic().orderBy('id', 'ASC')
  .fetchAll().then(function(rows) {
    rows.forEach(function (model) {
        topics.push( {
          'id': model.get('id'),
          'name': model.get('name')
        })
    });
    response.json(topics);
    response.status(200).end();
  })
  .catch(function(error) {
    console.error(error);
  });
});

app.get('/receivables', function(request, response) {
  let clientId = request.params['clientId'];

  var receivables = new Array();

  new Appointment()
    .where({ paid: null})
    .fetchAll({withRelated: ['client.appointments','topic.appointments']})
    .then(function(rows) {
      rows.toJSON().forEach(function(model) {
        receivables.push ({
          'appointment_id': model.id,
          'firstname': model.client.firstname,
          'lastname': model.client.lastname,
          'topicname': model.topic.name,
          'starttime': model.starttime,
          'duration': model.duration,
          'rate': model.rate,
          'billingpct': model.billingpct,
          'paid': (model.paid ? model.paid.toLocaleString("en-US", { timeZone: 'UTC' }) : '')
      })
    })

      response.json(receivables);
      response.status(200).end();
    })
    .catch(function(err) {
      console.error(err);
    });
});

app.post('/saveAppointment', function(request, response) {
  console.log(request.body);
  let offset = new Date().getTimezoneOffset();
  let apptDate = new Date(request.body.starttime);
  apptDate.setMinutes(apptDate.getMinutes() - offset)
  request.body.starttime = apptDate.toISOString().slice(0, 19).replace('T', ' ');

  bookshelf.transaction(function(t) {
    return new Appointment(request.body)
      .save(null, {transacting: t})
      .catch(t.rollback);
    })
    .then(function(model) {
      console.log(model.id);
      response.json({ 'appointmentId': model.id });
      response.status(200).end();
    })
});

app.post('/updatePaidDate', function(request, response) {
  bookshelf.transaction(function(t) {
    return new Appointment({ id: request.body['id']})
      .save({paid: request.body['paid']}, {patch: true}, {transacting: t})
      .catch(t.rollback);
    })
    .then(function(model) {
      // TODO Change to rowsAffected
      // TODO Rollback if too many rows updated
      response.json({ 'updatedAppointmentId': model.id });
      response.status(200).end();
    });
});

app.post('/saveClient', function(request, response) {
  var topicId = request.body.topic_id;
  delete request.body.topic_id;

  let offset = new Date().getTimezoneOffset();
  let firstContact = new Date(request.body.firstcontact);
  firstContact.setMinutes(firstContact.getMinutes() - offset)
  request.body.firstcontact = firstContact.toISOString().slice(0, 19).replace('T', ' ');

  let firstResponse = new Date(request.body.firstresponse);
  firstResponse.setMinutes(firstResponse.getMinutes() - offset)
  request.body.firstresponse = firstResponse.toISOString().slice(0, 19).replace('T', ' ');

  if (request.body.solicited === false) {
    request.body['firstcontact'] = null;
  }

  console.log(request.body);

  bookshelf.transaction(function(t) {
    if(!request.body.id) {
      return new Clientele(request.body)
        .save(request.body, {transacting: t})
        .tap(function(model) {
          return new ClientTopic({ client_id: model.id , topic_id: topicId})
            .save(null, {transacting: t})
        })
        .catch(t.rollback);
    } else {
      return new Clientele({ id: request.body.client_id })
      .save(request.body, {patch: true }, {transacting: t})
      .catch(t.rollback);
    }
  })
  .then(function(model) {
    // TODO Change to rowsAffected
    // TODO Rollback if too many rows updated
    response.json({ 'updatedClientId': model.id });
    response.status(200).end();
  });
});

app.get('/monthly-activity', function(request, response) {
  var sortColumn = request.query['sortColumn'];
  var sortOrder = request.query['sortOrder'];

  if (!sortColumn) {
    sortColumn = 'monthOfYear';
  }

  if (!sortOrder) {
    sortOrder = 'desc';
  }

  new Appointment()
  .query()
  .select(
    bookshelf.knex.raw('DATE_FORMAT(starttime, \'%Y-%m\') as monthOfYear'),
    bookshelf.knex.raw('SUM(duration / 60) as totalHours'),
    bookshelf.knex.raw('SUM(rate * (duration / 60) * billingpct) as totalRevenue'),
    bookshelf.knex.raw('SUM(rate * (duration / 60) * billingpct)/ sum(duration / 60) as averageRate')
  )
  .countDistinct('client_id as totalClients')
  .count('id as totalAppointments')
  .groupBy('monthOfYear')
  .orderBy(sortColumn, sortOrder)
  .tap(function(reportData) {
    response.json(reportData);
    response.status(200).end();
  });
});
