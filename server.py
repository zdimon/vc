from tornado import web, ioloop
from sockjs.tornado import SockJSRouter, SockJSConnection
from tornado import gen
import tornadoredis
import json

import redis
r = redis.StrictRedis(host='localhost', port=6379, db=0)


class ChatConnection(SockJSConnection):
    participants = set()
    video_rooms = set()
    def __init__(self,*args):
        super(ChatConnection, self).__init__(*args)  
        self._connect_to_redis()
        self.current_channel = None

    @gen.engine
    def _listen(self,channel):
        yield gen.Task(self._redis_client.subscribe, channel)
        self._redis_client.listen(self._on_update)

    def _connect_to_redis(self):
        self._redis_client = tornadoredis.Client(host='localhost', port=6379)
        self._redis_client.connect()

    @gen.coroutine
    def _on_update(self, message):
        """
        Receive Message from Redis when data become published and send it to selected client.
        :param message (Redis Message): data from redis
        """
        body = json.loads(message.body)
        self.send(message.body)

    def on_message(self, msg):
        message = json.loads(msg)
        act = message[0]
        data = json.loads(message[1])
        if act == 'connect':
            self._listen(data['room_id'])
            print 'I am listening %s chanel' % data['room_id']
            self.current_channel = data['room_id']
            # Send that someone joined
            self.broadcast(self.participants, json.dumps(['someone_joined',{'id': data['room_id']}]))
            # add all participants to current user's room
            for p in self.participants:
                r.publish(self.current_channel,json.dumps(['someone_joined', {'id': p.current_channel}]))     
        if act == 'init_rtc_room':
            print data
            self.video_rooms.add(self)
            self.broadcast(self.video_rooms, json.dumps(['peer.conected',{'id': data['room_id']}]))
        if act == 'new_rtc_stream':
            print data
            self.video_rooms.add(self)
            self.broadcast(self.participants, json.dumps(['new.rtc.stream',{'stream_id': data['stream_id']}]))
        if act == 'sdp-offer':
            print data
            self.broadcast(self.participants, json.dumps(['sdp.offer',data]))

        if act == 'send_message':
            print data
        else:
            self.send(msg)

    def on_open(self, info):
        # Add client to the clients list
        self.participants.add(self)

    def on_close(self):
        # Remove client from the clients list and broadcast leave message
        self.participants.remove(self)
        self.video_rooms.remove(self)
        self.broadcast(self.participants, json.dumps(['someone_left',{'id': self.current_channel}]))



