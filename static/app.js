(function () {
  'use strict';

    angular.module('ChatApp', ['ui.router','ng-socket'])

    .config(function($stateProvider, $urlRouterProvider, $socketProvider) {

       $socketProvider.configure({ address: 'http://localhost:9999/echo' });             

      $stateProvider

        .state('main', {
        url: '/',
        templateUrl: 'static/templates/index.html',
        controller: 'MainCtrl'
      });

      $urlRouterProvider.otherwise('/');
    })

    .controller('MainCtrl', function($scope, $socket) {
         $scope.messages = [];
         $scope.participans = [];

         $scope.sendMessage = function(){
            $.each($scope.participans, function( index, value ) {
              $socket.send('send_message',JSON.stringify({text: $scope.textMessage, room_id: value}));
            });
            
            $scope.textMessage = null;
         };

         $socket.on("send_message", function(event, data){
            $scope.messages.push(JSON.parse(data));
         });

         $socket.on("someone_joined", function(event, data){         
            var id = data['id']
            if($.inArray(id, $scope.participans)<0) {
            //$.inArray() returns the index of the item if it is found, and -1 otherwise
              $scope.participans.push(id);
            }   
            console.log($scope.participans);    
         });

         $socket.on("someone_left", function(event, data){         
            var id = data['id']
            if($.inArray(id, $scope.participans)>0) {
               // remove element
               $scope.participans.splice($.inArray(id, $scope.participans),1);
            }   
            console.log($scope.participans);    
         });


         $socket.start();
         $scope.sessionId = document.cookie.match(/csrftoken=[^;]+/)[0];
         $socket.send('connect',JSON.stringify({room_id: $scope.sessionId}));

    })

    .run(function ($rootScope, $socket) {




     })
;

})();
