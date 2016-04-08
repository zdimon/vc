(function () {
  'use strict';

angular.module('ChatApp')
  .factory('WebRTCRoom', function ($rootScope, $q, $socket) {
   

    var iceConfig = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]},
        peerConnections = {},
        currentId, roomId,
        stream;
    var connected = false;

    var api = {
      init: function (s) {
        stream = s;
      },
      joinRoom: function (r) {
        if (!connected) {
          $socket.send('init_rtc_room',JSON.stringify({room_id: 'test_room'}));

          //socket.emit('init', { room: r }, function (roomid, id) {
          //  currentId = id;
          //  roomId = roomid;
          //});

          connected = true;
        }
      }
    };

    return api;


});

})();
