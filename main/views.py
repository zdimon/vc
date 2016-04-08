from django.shortcuts import render

def index(request):
    return render(request, 'index.html', {})

from jsonview.decorators import json_view

import redis
import json
r = redis.StrictRedis(host='localhost', port=6379, db=0)

@json_view
def send_message(request):
    json_data = json.loads(request.body)
    for p in json_data['participants']:
        print 'sending message to %s chanel' % p
        r.publish(p,json.dumps(['send_message', {'text': json_data['message']}]))
    return {'status': 0, 'message': 'ok'}


