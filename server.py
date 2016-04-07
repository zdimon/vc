from tornado import web, ioloop
from sockjs.tornado import SockJSRouter, SockJSConnection
from tornado import gen
import tornadoredis
import json

class ChatConnection(SockJSConnection):
    participants = set()
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
        self.broadcast(self.participants, json.dumps(['someone_left',{'id': self.current_channel}]))


