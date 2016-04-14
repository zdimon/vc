(function () {
  'use strict';

angular.module('ChatApp')
  .factory('WebRTCRoom', function ($rootScope, $q, $socket) {
   
    $rootScope.rtc_connections = [];
    var iceConfig = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]},
        peerConnections = {},
        currentId, roomId,
        stream;
    var connected = false;


        function getPeerConnection(id) {
          if (peerConnections[id]) {
            return peerConnections[id];
          }
          var pc = new RTCPeerConnection(iceConfig);
          peerConnections[id] = id;
          pc.addStream(stream);
          pc.onicecandidate = function (evnt) {
             console.log({ by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
            //socket.emit('msg', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
          };

          pc.onaddstream = function (evnt) {
                console.log('Received new stream');
                
              };
          return pc;
         };

        function makeOffer(id) {
          var pc = getPeerConnection(id);
         
          
          pc.createOffer(function (sdp) {
            pc.setLocalDescription(sdp);
            console.log('Creating an offer for', id);
            $socket.send('sdp-offer',JSON.stringify({ by: id, sdp: sdp, type: 'sdp-offer' }));
            console.log({ by: id, sdp: sdp, type: 'sdp-offer' });
            //socket.emit('msg', { by: currentId, to: id, sdp: sdp, type: 'sdp-offer' });
          }, function (e) {
            console.log(e);
          },
          { mandatory: { "offerToReceiveAudio":true,"offerToReceiveVideo":true }});

          
        };


        $socket.on("peer.conected", function(event, data){         
            console.log('perr.conected '+data.id);   
            makeOffer(data.id); 
         });


        $socket.on("new.rtc.stream", function(event, data){         
            console.log('new.rtc.stream',data);   
            $rootScope.rtc_connections.push(data.stream_id);
            console.log($rootScope.rtc_connections);
         });

        $socket.on("sdp.offer", function(event, data){         
            console.log('sdp.offer from '+data.by);   
            if (data.by != $rootScope.sessionId) {
              pc = getPeerConnection(data.by)
              pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
                console.log('Setting remote description by answer');
              }, function (e) {
                console.error(e);
              });
            };
         });




    var api = {
      init: function (s) {
        stream = s;
      },
      joinRoom: function (r) {
        if (!connected) {
          $socket.send('init_rtc_room',JSON.stringify({room_id: $rootScope.sessionId}));

          //socket.emit('init', { room: r }, function (roomid, id) {
          //  currentId = id;
          //  roomId = roomid;
          //});

          connected = true;
        }
      },

      makeOffer: makeOffer,      

      BroadcastNewStream: function (r) {
        if (!connected) {
          $socket.send('new_rtc_stream',JSON.stringify({stream_id: $rootScope.sessionId}));
        }
      }

    };

    return api;


});

})();
