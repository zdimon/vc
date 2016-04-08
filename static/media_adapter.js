    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
    window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
    window.URL = window.URL || window.mozURL || window.webkitURL;
    window.navigator.getUserMedia = window.navigator.getUserMedia || window.navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;


(function () {
  'use strict';

    angular.module('ChatApp')
      .factory('VideoStream', function ($q) {
        var stream;
        return {
          get: function () {
            if (stream) {
              return $q.when(stream);
            } else {
              var d = $q.defer();
              navigator.getUserMedia({
                video: true,
                audio: true
              }, function (s) {
                stream = s;
                d.resolve(stream);
              }, function (e) {
                d.reject(e);
              });
              return d.promise;
            }
          }
        };
      });
})();

