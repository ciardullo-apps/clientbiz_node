var express = require('express');
var app = express();
var clientBizRouter = express.Router();
var fs = require('fs');
var https = require('https');
var bodyParser = require('body-parser');
var knex = require('knex');
var bookshelf = require('./bookshelf');
var Promise = require('bluebird')

const cors = require('cors');

const config = require('./config');
console.log(config);
console.log('Are you getting 401 Unauthorized?', `Change your passport strategy, currently ${config.passportStrategy}`)
// Use 'local' passport strategy for NodeJS/AngularJS
// Use 'jwt' for Angular2

var passport = require('passport');
var passportStrategy = require('./passport-strategy')(passport);
app.use(passport.initialize());
app.use(passport.session());
var auth = require('./auth')(passport);

// Allow only requests from this server's frontend
const corsOptions = {
  origin: `${config.protocol}://${config.hostName}:${config.clientPort}`,
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  methods: 'GET, PUT, POST, OPTIONS',
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions));

// app.use((req, res, next) => {
// 	res.setHeader('Access-Control-Allow-Origin', `${dotenv.protocol}://${dotenv.hostName}:${dotenv.clientPort}`);
// 	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
// 	res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
// 	res.setHeader('Access-Control-Allow-Credentials', 'true');
// 	next();
// });

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
  tableName: 'clienttopic',
  topic: function() {
    return this.hasOne(Topic, 'id', 'topic_id');
  }
});


// Routes
clientBizRouter.get('/client', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
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

clientBizRouter.get('/client/:clientId', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
  var clientId = request.params['clientId'];

  var client = { };

  new Clientele()
    .where('id', clientId)
    .fetch()
    .then(function(model) {
        client.id =  model.get('id');
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

clientBizRouter.get('/appointments/:clientId', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
  let clientId = request.params['clientId'];

  var appointments = new Array();

  new Appointment()
    .where('client_id', clientId)
    .orderBy('starttime', 'ASC')
    .fetchAll({withRelated: ['client', 'topic']})
    .then(function(rows) {
      rows.forEach(function (model) {
        var topicInfo = model.related('topic');
        appointments.push ({
          'id': model.get('id'),
          'client_id': model.get('client_id'),
          'topic_id': model.get('topic_id'),
          'topic_name': topicInfo.get('name'),
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

clientBizRouter.get('/topics', function(request, response) {
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

clientBizRouter.get('/topics/:clientId', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
  var clientId = request.params['clientId'];

  var topics = new Array();

  new ClientTopic()
  .where('client_id', clientId)
  .fetchAll({withRelated: ['topic']})
  .then(function(rows) {
    rows.toJSON().forEach(function (model) {
      // topics.push(model.topic_id)
      topics.push ({
        'id': model.topic_id,
        'name': model.topic.name
    })
    })
    response.json(topics);
    response.status(200).end();
    // response.json(rows.serialize());
  })
  .catch(function(error) {
    console.error(error);
  });
});

clientBizRouter.get('/receivables', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
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

clientBizRouter.post('/saveAppointment', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
  console.log(request.body);
  delete request.body.username
  delete request.body.password
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

clientBizRouter.post('/updatePaidDate', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
  console.log(request.body);
  delete request.body.username
  delete request.body.password
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

clientBizRouter.post('/saveClient', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
  var assignedTopics = request.body.assigned_topics;
  delete request.body.assigned_topics; // Not part of the Clientele relation
  delete request.body.username
  delete request.body.password

  let offset = new Date().getTimezoneOffset();
  if (request.body.solicited === 0) {
    request.body['firstcontact'] = null;
  } else {
    let firstContact = new Date(request.body.firstcontact);
    firstContact.setMinutes(firstContact.getMinutes() - offset)
    request.body.firstcontact = firstContact.toISOString().slice(0, 19).replace('T', ' ');
  }

  let firstResponse = new Date(request.body.firstresponse);
  firstResponse.setMinutes(firstResponse.getMinutes() - offset)
  request.body.firstresponse = firstResponse.toISOString().slice(0, 19).replace('T', ' ');

  console.log(request.body);

  let insertTopics = new Array();
  assignedTopics.forEach((topicId) => {
    insertTopics.push({
      topic_id: topicId
    })
  });

  bookshelf.transaction(function(t) {
    let clientele;
    let payload = null;
    let options = {transacting: t}
    if(!request.body.id) {
      clientele = new Clientele(request.body)
    } else {
      clientele = new Clientele(request.body.id)
      payload = request.body
      options.patch = true;
    }
    return clientele
      .save(payload, options)
      .tap(function(model) {
        return Promise.map(insertTopics, function(info) {
          return new ClientTopic(info)
            .save({'client_id': model.id}, {transacting: t})
            .catch(function(err) {
              console.warn(err.sqlMessage); // OK if topic was previously assigned
            });
        })
      })
      .catch(function(err) {
        console.log(err);
        t.rollback(err);
      })
      .then((model) => {
        // TODO Change to rowsAffected
        // TODO Rollback if too many rows updated
        response.json({ 'updatedClientId': model.id });
        response.status(200).end();
      });
  })
});

clientBizRouter.get('/monthly-activity', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
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

clientBizRouter.get('/activity-year-month/:year/:month', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
  var sortColumn = request.query['sortColumn'];
  var sortOrder = request.query['sortOrder'];

  if (!sortColumn) {
    sortColumn = 'appointment.id';
  }

  if (!sortOrder) {
    sortOrder = 'desc';
  }

  var year = parseInt(request.params['year']);
  var month = parseInt(request.params['month']);

  new Appointment()
  .query()
  .select('appointment.*', 'clientele.firstname', 'clientele.lastname', 'topic.name as topicname')
  .join('clientele', {'appointment.client_id': 'clientele.id'})
  .join('topic', {'appointment.topic_id': 'topic.id'})
  .whereRaw('YEAR(starttime) = ? and MONTH(starttime) = ?', [year, month])
  .orderBy(sortColumn, sortOrder)
  .tap(function(reportData) {
    response.json(reportData);
    response.status(200).end();
  })
});

clientBizRouter.get('/revenue-by-topic/:year?', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
  var year = parseInt(request.params['year']);
  console.log(year);
  new Appointment()
  .query()
  .select(
    'name',
    //  bookshelf.knex.raw('SUM(rate * (duration / 60) * billingpct) as totalRevenue'),
    bookshelf.knex.raw('sum(rate * (duration / 60) * billingpct) as totalRevenue, convert(sum(rate * (duration / 60) * billingpct) / sum(sum(rate * (duration / 60) * billingpct)) over () * 100, decimal(9,2)) as pctOfTotal')
  )
  .join('topic', {'appointment.topic_id': 'topic.id'})
  .modify(function(qb) {
    if(year) {
      qb.whereRaw('YEAR(starttime) = ?', [year]);
    }
  })
  .groupBy('name')
  .tap(function(reportData) {
    response.json(reportData);
    response.status(200).end();
  })
});

clientBizRouter.get('/revenue-years', passport.authenticate(config.passportStrategy, { session: false }), function(request, response) {
  new Appointment()
  .query()
  .select(bookshelf.knex.raw('distinct year(starttime) as revenueYear'))
  .orderBy('revenueYear')
  .tap(function(reportData) {
    response.json(reportData);
    response.status(200).end();
  })
});

app.use('/clientbiz-node', express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Use unencrypted connections from nginx
// Read certs and private key from filesystem
var key = fs.readFileSync(config.tlsKeyPath);
var cert = fs.readFileSync( config.tlsCertPath);
var ca = fs.readFileSync(config.tlsCertAuthPath);

var options = {
  key: key,
  cert: cert,
  ca: ca
};

app.use('/clientbiz-node', clientBizRouter);
app.use('/clientbiz-node/auth', auth);
// var port = 3001;
https.createServer(options, app).listen(config.serverPort);


/*
app.use('/clientbiz-node', clientBizRouter);
var port = 3001;
app.listen(port); // Unencrypted connections
*/

console.log('Application listening on port ' + config.serverPort);
