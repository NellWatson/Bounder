import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.httpserver
import json


class WebSocketHandler(tornado.websocket.WebSocketHandler):
    clients = []
    telemetry_entry_list = []
    last_msg = None
    browser_location_msg = None
    device_num = 0;


    def open(self, *args):
        print 'connected'
        self.device_id = None
        self.conn_id = None
        self.browser_location = None
        WebSocketHandler.clients.append(self)

    def on_message(self, message):
        if self not in WebSocketHandler.clients:
            return
        try:
            msg = json.loads(message)
        except:
            self.write_message(json.dumps({'error': 'not a valid json'}))
            self.close()
            return

        if 'type' in msg:
            # print msg
            if msg['type'] == 'gps':

                if 'device_id' in msg:
                    if msg['device_id'] != self.device_id:
                        print 'device_id', msg['device_id']
                        self.conn_id = WebSocketHandler.device_num
                        WebSocketHandler.device_num += 1
                        self.device_id = msg['device_id']

                    if self.browser_location !=  WebSocketHandler.browser_location_msg:
                        self.browser_location =  WebSocketHandler.browser_location_msg
                        self.write_message(self.browser_location)

                msg['conn_id'] = str(self.conn_id)
                WebSocketHandler.telemetry_entry_list.insert(0, msg)
                WebSocketHandler.last_msg = msg

            elif msg['type'] == 'browser_location':
                WebSocketHandler.browser_location_msg = msg
                for socket in WebSocketHandler.clients:
                    if socket.device_id is not None and socket.browser_location != msg:
                        socket.write_message(json.dumps(msg, ensure_ascii=False))

    def on_close(self):
        print 'closed', self.device_id
        if self in WebSocketHandler.clients:
            WebSocketHandler.clients.remove(self)
        if self.device_id is not None:
            for socket in WebSocketHandler.clients:
                if socket.device_id is None:
                    socket.write_message(json.dumps({'type': 'device_gone', 'id': self.conn_id}, ensure_ascii=False))

    def check_origin(self, origin):
        return True

def send_to_clients():
    try:
        num_devices = 0
        for socket in WebSocketHandler.clients:
            if socket.device_id is not None:
                num_devices += 1
        for socket in WebSocketHandler.clients:
            if socket.device_id is None:
                if num_devices > 0:
                    to_send = list(reversed(WebSocketHandler.telemetry_entry_list))
                    for d_entry in to_send:
                        socket.write_message(json.dumps(d_entry, ensure_ascii=False))
                else:
                    socket.write_message(json.dumps({'type':'no_devices_online'}, ensure_ascii=False))
    except Exception as e:
        print(e)
    finally:
        WebSocketHandler.telemetry_entry_list = []


class AreaHandler(tornado.web.RequestHandler):

    def get(self):
        print 'AreaHandler get'
        if WebSocketHandler.last_msg is not None:
            self.write(WebSocketHandler.last_msg['polygon_geojs'])

    def post(self):
        print 'AreaHandler post'

        try:
            for socket in WebSocketHandler.clients:
                if socket.device_id is not None:
                    socket.write_message(self.request.body)
        except Exception as e:
            print(e)



http_server = tornado.httpserver.HTTPServer(
    tornado.web.Application([
        (r'/ws', WebSocketHandler),
        (r"/geometry", AreaHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": 'html', "default_filename": "leaflet_example.html"})])
    )
http_server.listen(80)
tornado.ioloop.PeriodicCallback(send_to_clients, 200, tornado.ioloop.IOLoop.instance()).start()
tornado.ioloop.IOLoop.instance().start()
