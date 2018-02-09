// angular code runs on the browser
var clientBizApp = angular.module('clientBizApp', []);

function clientListController($scope, $http) {
  $scope.formData = {};

  $scope.selectClient = function(clientId) {
    if (!clientId) {
      console.log('No client selected');
      return;
    }

    $http.get('/client/' + clientId)
      .success(function(data) {
        // alert(JSON.stringify(data));

        // Advance to next hour
        var date = new Date();
        var nextHour = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        nextHour.setMinutes(0);
        nextHour.setHours(nextHour.getHours() + 1);

        $scope.formData = {
          'client_id': data.client.clientId,
          'topic_id': "2",
          'starttime': nextHour.toJSON().slice(0,16),
          'duration': 60,
          'rate': 60,
          'billingpct': 0.75
        };

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

      $http.get('/appointments/' + clientId)
        .success(function(data) {
          $scope.appointments = data.appointments;
        })
        .error(function(data) {
        });
  }

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

}
