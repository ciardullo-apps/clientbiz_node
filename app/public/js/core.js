// angular code runs on the browser
// var clientBizApp = angular.module('clientBizApp', ['ngRoute','ngResource']);

var app = angular.module('clientBizApp', ['ngRoute', 'chart.js']);
// Needed by Passport local strategy in the request
let localCredentials = {
  params: {
    username: 'a',
    password: 'a'
  }
};

angular.module('clientBizApp').
  config(['$routeProvider',
    function config($routeProvider) {
      $routeProvider
      .when('/client', {
        templateUrl: 'client-list.html',
        controller: 'clientListController'
      })
      .when('/appointments/:clientId', {
        templateUrl: 'appointment-list.html',
        controller: 'appointmentListController'
      })
      .when('/addAppointment', {
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
      .when('/reports/:name/:params*?', {
        templateUrl: function(templateBaseName) {
          return 'reports/' + templateBaseName.name + '.html';
        },
        controller: 'reportController',
      })
      .when('/graph/:name', {
        templateUrl: 'graph.html',
        controller: 'graphController'
      });
    }
  ]);

var sortOrders =  [ 'asc', 'desc' ];
var sortOrderIndex = 1;

// clientBizApp.config(function($routeProvider) {
//   $routeProvider
// });

app.controller("clientListController", function ($scope, $http) {
  $scope.formData = {};
  $http.get('client', localCredentials)
    .then(function successCallback(response) {
      $scope.clients = response.data;
    }, function errorCallback(response) {
      console.log(response);
    });

  $http.get('topics')
    .then(function successCallback(response) {
      $scope.topics = response.data.topics;
    }, function errorCallback(response) {
      console.log(response);
    });

  $scope.loadClients = function(sortColumn) {
    var config = {
        params: Object.assign({},
        {
          'sortColumn': sortColumn,
          'sortOrder': sortOrders[(sortOrderIndex ^= 1)]
        },
        localCredentials.params)
      };
    $http.get('client', config)
      .then(function successCallback(response) {
        $scope.clients = response.data;
      }, function errorCallback(response) {
        console.log(response);
      });
  }
});

app.controller("appointmentListController", function ($scope, $http, $routeParams) {
  var clientId = $routeParams['clientId'];
  $http.get('appointments/' + clientId, localCredentials)
    .then(function successCallback(response) {
      $scope.appointments = response.data;
    }, function errorCallback(response) {
      console.log(response);
    });

  $http.get('topics')
    .then(function successCallback(response) {
      $scope.topics = response.data.topics;
    }, function errorCallback(response) {
      console.log(response);
    });

  $http.get('client/' + clientId, localCredentials)
    .then(function successCallback(response) {
      $scope.client = {
        'client_id': response.data.clientId,
        'firstname': response.data.firstname,
        'lastname': response.data.lastname,
        'contactname': response.data.contactname,
        'city': response.data.city,
        'state': response.data.state,
        'timezone': response.data.timezone,
        'firstcontact': response.data.firstcontact,
        'firstresponse': response.data.firstresponse,
        'solicited': !!+response.data.solicited
      };
    }, function errorCallback(response) {
      console.log(response);
    });
});

app.controller("createAppointmentController", function ($scope, $http) {
  var clients = { };
  var topics = { };

  $http.get('client', localCredentials)
    .then(function successCallback(response) {
      $scope.clients = response.data;

      $http.get('topics')
        .then(function successCallback(response) {
          $scope.topics = response.data;
        }, function errorCallback(response) {
          console.log(response);
        });
    }, function errorCallback(response) {
      console.log(response);
    });

  // Advance to next hour
  var date = new Date();
  var nextHour = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  nextHour.setMinutes(0);
  nextHour.setHours(nextHour.getHours() + 1);

  $scope.formData = {
    // 'client_id': 10,
    // 'topic_id': "2",
    'starttime': new Date(nextHour.toJSON().slice(0,16)),
    'duration': 60,
    'rate': 69,
    'billingpct': 0.75
  };

  $scope.saveAppointment = function() {
    // $scope.formData.starttime = $scope.formData.starttime.toJSON().slice(0,16);

    $http({
        method: 'POST',
        url: 'saveAppointment',
        data: Object.assign({}, $scope.formData, localCredentials.params)
      })
      .then(function successCallback(response) {
        console.log(response.data);
      }, function errorCallback(response) {
        console.log(response);
      });
    };
});

app.controller("receivablesController", function ($scope, $http, $routeParams) {
  $scope.updateAppointmentData = {};
  $scope.outstanding = 0.0;

  // Default to today
  var date = new Date();
  var nextHour = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

  $http.get('receivables', localCredentials)
    .then(function successCallback(response) {
      $scope.receivables = response.data;
      $scope.paiddate =  nextHour;
    }, function errorCallback(response) {
      console.log(response);
    });

  $scope.getPaid = function(appointmentId) {
    $scope.formData = {
      "id": appointmentId,
      "paid":  $scope.paiddate.toJSON().slice(0,10)
    }

    $http({
        method: 'POST',
        url: 'updatePaidDate',
        data: Object.assign({}, $scope.formData, localCredentials.params)
      })
      .then(function successCallback(response) {
        console.log(response.data)
      }, function errorCallback(response) {
        console.log(response.data);
      });
  }
});

app.controller("editClientController", function ($scope, $http, $routeParams) {
  var clientId = $routeParams['clientId'];
  $http.get('topics')
    .then(function successCallback(response) {
      $scope.topics = response.data;
    }, function errorCallback(response) {
      console.log(response.data);
    });

  // Advance to next hour
  var date = new Date();
  var nextHour = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  nextHour.setMinutes(0);
  nextHour.setHours(nextHour.getHours() + 1);

  if (clientId) {
    $http.get('client/' + clientId, localCredentials)
    .then(function successCallback(response) {
      $scope.formData = {
        'id': response.data.id,
        'firstname': response.data.firstname,
        'lastname': response.data.lastname,
        'contactname': response.data.contactname,
        'city': response.data.city,
        'state': response.data.state,
        'timezone': response.data.timezone,
        'firstcontact': new Date(response.data.firstcontact),
        'firstresponse': new Date(response.data.firstresponse),
        'solicited': !!+response.data.solicited
      };
    }, function errorCallback(response) {
      console.log(response.data);
    });
    $http.get('topics/' + clientId, localCredentials)
    .then(function successCallback(response) {
      $scope.formData.assigned_topics = response.data;
    }, function errorCallback(response) {
      console.log(response.data);
    });
  } else {
    $scope.formData = {
      'firstcontact': new Date(nextHour.toJSON().slice(0,16)),
      'firstresponse': new Date(nextHour.toJSON().slice(0,16)),
      'solicited': true
    };
  }

  $scope.saveClient = function() {
    $http({
        method: 'POST',
        url: 'saveClient',
        data: Object.assign({}, $scope.formData, localCredentials.params)
      })
      .then(function successCallback(response) {
        console.log(response.data);
        $scope.formData.id = response.data.updatedClientId;
      }, function errorCallback(response) {
        console.log(response.data);
      });
  }
});

app.controller("reportController", function ($scope, $http, $routeParams) {
  $scope.formData = {};
  console.log($routeParams.name);
  console.log($routeParams);

  let endpoint = $routeParams.name;
  if($routeParams.params) {
    endpoint = endpoint + '/' + $routeParams.params;
  }

  $http.get(endpoint, localCredentials)
    .then(function successCallback(response) {
      $scope.reportData = response.data;
    }, function errorCallback(response) {
      console.log(response.data);
    });

  $scope.loadReport = function(sortColumn) {
    var config = {
        params: Object.assign({},
        {
          'sortColumn': sortColumn,
          'sortOrder': sortOrders[(sortOrderIndex ^= 1)]
        },
        localCredentials.params)
      };
    $http.get(endpoint, config)
      .then(function successCallback(response) {
        $scope.reportData = response.data;
      }, function errorCallback(response) {
        console.log(response.data);
      });
  }
});

app.controller("graphController", function ($scope, $http, $routeParams) {
  $scope.formData = {};
  console.log($routeParams.name);
  console.log($routeParams);

  let endpoint = $routeParams.name;
  if($routeParams.params) {
    endpoint = endpoint + '/' + $routeParams.params;
  }

  $http.get('revenue-years', localCredentials)
    .then(function successCallback(response) {
      console.log(response.data);
      $scope.revenueYears = [{ 'revenueYear': 'ALL' }].concat(response.data);
    }, function errorCallback(response) {
      console.log(response);
    });

  $scope.labels = [];
  $scope.data = [];
  $http.get(endpoint, localCredentials)
    .then(function successCallback(response) {
      console.log(response.data);
      response.data.forEach(function (rowData) {
        $scope.labels.push(rowData.name);
        $scope.data.push(rowData.pctOfTotal);
      });
      $scope.options = {
        legend: {
            display: true,
            position: 'left',
            labels: {
                fontColor: 'rgb(255, 99, 132)'
            }
        }
      };
    }, function errorCallback(response) {
      console.log(response.data);
    });

    $scope.loadRevenueByTopicYear = function(revenueYear) {
      $scope.labels = [];
      $scope.data = [];

      $http.get('revenue-by-topic/' + revenueYear, localCredentials)
        .then(function successCallback(response) {
          response.data.forEach(function (rowData) {
            $scope.labels.push(rowData.name);
            $scope.data.push(rowData.pctOfTotal);
          });
          $scope.options = {
            legend: {
                display: true,
                position: 'left',
                labels: {
                    fontColor: 'rgb(255, 99, 132)'
                }
            }
          };
        }, function errorCallback(response) {
          console.log(response.data);
        });
    }
});
