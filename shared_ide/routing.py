# Copyright (c) Timur Iskhakov.


from channels.routing import route
from ide.consumers import ws_connect, ws_message, ws_disconnect


channel_routing = [
    route("websocket.connect", ws_connect, path=r'^/ws/(?P<document>[a-zA-Z0-9]+)/(?P<id>[a-zA-Z0-9]+)/$'),
    route("websocket.receive", ws_message, path=r'^/ws/(?P<document>[a-zA-Z0-9]+)/(?P<id>[a-zA-Z0-9]+)/$'),
    route("websocket.disconnect", ws_disconnect, path=r'^/ws/(?P<document>[a-zA-Z0-9]+)/(?P<id>[a-zA-Z0-9]+)/$'),
]
