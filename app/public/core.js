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
        $scope.client = {
          'clientId': data.client.clientId,
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

}
