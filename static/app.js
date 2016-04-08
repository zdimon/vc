var app;

(function () {
  'use strict';

    var app = angular.module('ChatApp', ['ui.router','ng-socket'])

    .config(function($stateProvider, $urlRouterProvider, $socketProvider, $httpProvider) {

        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];

       $socketProvider.configure({ address: 'http://localhost:9999/echo' });             

      $stateProvider

        .state('main', {
        url: '/',
        templateUrl: 'static/templates/index.html',
        controller: 'MainCtrl'
      });

      $urlRouterProvider.otherwise('/');
    })


    .controller('MainCtrl', function($scope, $socket, $http, VideoStream, WebRTCRoom) {

        //WebRTC

        if (!window.RTCPeerConnection || !navigator.getUserMedia) {
          alert('WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.');
          return;
        }
        var stream;
        VideoStream.get()
        .then(function (s) {
            stream = s;
            WebRTCRoom.init(stream);
            stream = URL.createObjectURL(stream);
            WebRTCRoom.joinRoom('test_room');
        }, function () {
          alert('No audio/video permissions. Please refresh your browser and allow the audio/video capturing.');
       });


         $scope.messages = [];
         $scope.participants = [];

         $scope.sendMessage = function(){
            
                var url = 'http://localhost:8080/send_message'
                var data = { 
                             'participants': $scope.participants,
                             'message':$scope.textMessage
                           }

                return $http.post(url, data).success(function(result){
                    console.log(result);
                    $scope.textMessage = null;
                });
            
         };

         $socket.on("send_message", function(event, data){
             console.log(data);
            $scope.messages.push(data);
         });

         $socket.on("someone_joined", function(event, data){         
            var id = data['id']
            if($.inArray(id, $scope.participants)<0) {
            //$.inArray() returns the index of the item if it is found, and -1 otherwise
              $scope.participants.push(id);
            }   
            console.log($scope.participants);    
         });

         $socket.on("someone_left", function(event, data){         
            var id = data['id']
            if($.inArray(id, $scope.participants)>0) {
               // remove element
               $scope.participants.splice($.inArray(id, $scope.participants),1);
            }   
            console.log($scope.participants);    
         });


         $socket.start();
         $scope.sessionId = document.cookie.match(/csrftoken=[^;]+/)[0];
         $socket.send('connect',JSON.stringify({room_id: $scope.sessionId}));

    })


;

})();
