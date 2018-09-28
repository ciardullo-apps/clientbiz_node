// angular code runs on the browser
var clientBizApp = angular.module('clientBizApp', []);

var sortOrders =  [ 'asc', 'desc' ];
var sortOrderIndex = 1;

clientBizApp.config(function($routeProvider) {
  $routeProvider
    .when('/client', {
      templateUrl: 'client-list.html',
      controller: 'clientListController'
    })
    .when('/appointments/:clientId', {
      templateUrl: 'appointment-list.html',
      controller: 'appointmentListController'
    })
    .when('/addAppointment/:clientId', {
      templateUrl: 'create-appointment.html',
      controller: 'createAppointmentController'
    })
    .when('/receivables', {
      templateUrl: 'receivables.html',
      controller: 'receivablesController'
    })
    .when('/client/:clientId', {
      templateUrl: 'edit-client.html',
      controller: 'editClientController'
    })
    .when('/addClient', {
      templateUrl: 'edit-client.html',
      controller: 'editClientController'
    })
;
});

function clientListController($scope, $http) {
  $scope.formData = {};
  $http.get('/client')
    .success(function(data) {
          $scope.clients = data;
    })
    .error(function(data) {
    });

  $http.get('/topics')
    .success(function(data) {
      $scope.topics = data.topics;
    })
    .error(function(data) {
    });

  $scope.loadClients = function(sortColumn) {
    var config = {
        params: {
          'sortColumn': sortColumn,
          'sortOrder': sortOrders[(sortOrderIndex ^= 1)]
        }
      };
    $http.get('/client', config)
      .success(function(data) {
            $scope.clients = data;
      })
      .error(function(data) {
      });
  }
}

function appointmentListController($scope, $http, $routeParams) {
  var clientId = $routeParams['clientId'];
  $http.get('/appointments/' + clientId)
    .success(function(data) {
      $scope.appointments = data;
    })
    .error(function(data) {
    });

  $http.get('/topics')
    .success(function(data) {
      $scope.topics = data.topics;
    })
    .error(function(data) {
    });

  $http.get('/client/' + clientId)
    .success(function(data) {
      // alert(JSON.stringify(data));

      $scope.client = {
        'client_id': data.clientId,
        'firstname': data.firstname,
        'lastname': data.lastname,
        'contactname': data.contactname,
        'city': data.city,
        'state': data.state,
        'timezone': data.timezone,
        'firstcontact': data.firstcontact,
        'firstresponse': data.firstresponse,
        'solicited': !!+data.solicited
      };

    })
    .error(function(data) {
    });

}

function createAppointmentController($scope, $http, $routeParams) {
  // var clientId = $routeParams['clientId'];
  var clients = { };
  var topics = { };

  $http.get('/client')
    .success(function(data) {
      $scope.clients = data;

      $http.get('/topics')
        .success(function(data) {
          $scope.topics = data.topics;
        })
        .error(function(data) {
      });

    })
    .error(function(data) {
  });

  // Advance to next hour
  var date = new Date();
  var nextHour = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  nextHour.setMinutes(0);
  nextHour.setHours(nextHour.getHours() + 1);

  $scope.formData = {
    // 'client_id': 10,
    // 'topic_id': "2",
    'starttime': nextHour.toJSON().slice(0,16),
    'duration': 60,
    'rate': 60,
    'billingpct': 0.80
  };

  $scope.saveAppointment = function() {
    $http({
        method: 'POST',
        url: '/saveAppointment',
        data: $scope.formData,
      })
      .success(function(data) {
        console.log(data);
        $http.get('/appointments/' + $scope.formData['client_id'])
          .success(function(data) {
            $scope.appointments = data;
          })
          .error(function(data) {
          });

      });

  }
}

function receivablesController($scope, $http, $routeParams) {
  $scope.updateAppointmentData = {};

  // Default to today
  var date = new Date();
  var nextHour = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

  $http.get('/receivables')
    .success(function(data) {
      $scope.receivables = data;
      $scope.paiddate =  nextHour.toJSON().slice(0,10);
    })
    .error(function(data) {
      console.log(data);
    });

  $scope.getPaid = function(appointmentId) {
    $scope.formData = {
      "id": appointmentId,
      "paid":  $scope.paiddate
    }

    $http({
        method: 'POST',
        url: '/updatePaidDate',
        data: $scope.formData,
      })
      .success(function(data) {
        console.log(data)
      })
      .error(function(data) {
        console.log(data);
      });
  }
}

function editClientController($scope, $http, $routeParams) {
  var clientId = $routeParams['clientId'];
  var topics = { };
  $http.get('/topics')
    .success(function(data) {
      $scope.topics = data.topics;
    })
    .error(function(data) {
  });

  // Advance to next hour
  var date = new Date();
  var nextHour = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  nextHour.setMinutes(0);
  nextHour.setHours(nextHour.getHours() + 1);

  if (clientId) {
    $http.get('/client/' + clientId)
      .success(function(data) {
        // alert(JSON.stringify(data));
        $scope.formData = {
          'id': data.clientId,
          'firstname': data.firstname,
          'lastname': data.lastname,
          'contactname': data.contactname,
          'city': data.city,
          'state': data.state,
          'timezone': data.timezone,
          'firstcontact': data.firstcontact,
          'firstresponse': data.firstresponse,
          'solicited': !!+data.solicited
        };

      })
      .error(function(data) {
      });

  } else {
    $scope.formData = {
      'topic_id': 2,
      'firstcontact': nextHour.toJSON().slice(0,16),
      'firstresponse': nextHour.toJSON().slice(0,16),
      'solicited': "1"
    };
  }

  $scope.saveClient = function() {
    $http({
        method: 'POST',
        url: '/saveClient',
        data: $scope.formData,
      })
      .success(function(data) {
        console.log(data);
      });

  }
}
