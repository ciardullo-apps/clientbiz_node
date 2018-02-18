// angular code runs on the browser
var clientBizApp = angular.module('clientBizApp', []);

clientBizApp.config(function($routeProvider) {
  $routeProvider
    .when('/client', {
      templateUrl: 'client-list.html',
      controller: 'clientListController'
    })
    .when('/appointments/:clientId', {
      templateUrl: 'appointment-list.html',
      controller: 'appointmentListController'
    });
});

function appointmentListController($scope, $http, $routeParams) {
  var clientId = $routeParams['clientId'];
  $http.get('/appointments/' + clientId)
    .success(function(data) {
      $scope.appointments = data.appointments;
    })
    .error(function(data) {
    });

  $http.get('/client/' + clientId)
    .success(function(data) {
      // alert(JSON.stringify(data));

/* TODO Use for new appointment
      $scope.formData = {
        'client_id': data.client.clientId,
        'topic_id': "2",
        'starttime': nextHour.toJSON().slice(0,16),
        'duration': 60,
        'rate': 60,
        'billingpct': 0.75
      };
*/
      $scope.client = {
        'client_id': data.client.clientId,
        'firstname': data.client.firstname,
        'lastname': data.client.lastname,
        'contactname': data.client.contactname,
        'city': data.client.city,
        'state': data.client.state,
        'timezone': data.client.timezone,
        'firstcontact': data.client.firstcontact,
        'firstresponse': data.client.firstresponse,
        'solicited': !!+data.client.solicited
      };

    })
    .error(function(data) {
    });
}

function clientListController($scope, $http) {
  $scope.formData = {};
  $scope.updateAppointmentData = {};

  $http.get('/client')
    .success(function(data) {
          $scope.clients = data.clients;
    })
    .error(function(data) {
    });

  $http.get('/topics')
    .success(function(data) {
      $scope.topics = data.topics;
    })
    .error(function(data) {
    });

  $http.get('/receivables')
    .success(function(data) {
      $scope.receivables = data.receivables;
    })
    .error(function(data) {
    });

  $scope.saveAppointment = function() {
    $http({
        method: 'POST',
        url: '/saveAppointment',
        data: $.param($scope.formData), // pass fields as strings
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        } // set the headers so angular passes fields as form data and not request payload
      })
      .success(function(data) {
        console.log(data);
        $http.get('/appointments/' + $scope.formData['client_id'])
          .success(function(data) {
            $scope.appointments = data.appointments;
          })
          .error(function(data) {
          });
      });

  }

  $scope.getPaid = function(appointmentId) {
    $scope.updateAppointmentData["id"] = appointmentId;
    $scope.updateAppointmentData["paid"] = $('#datePicker').val();

    $http({
        method: 'POST',
        url: '/updateAppointment',
        data: $.param($scope.updateAppointmentData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      .success(function(data) {
        console.log(data);
        $http.get('/appointments/' + $scope.formData['client_id'])
          .success(function(data) {
            $scope.appointments = data.appointments;
          })
          .error(function(data) {
          });
      });
  }

}
