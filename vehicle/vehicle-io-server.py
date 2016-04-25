import tornado.ioloop
import tornado.web
import geojson
from shapely.geometry import shape, Point
from dronekit import connect
from dronekit import LocationGlobal
import signal
import sys
import tornado.websocket
import time
import json
import ssl
import math
from tornado import gen


device_id = 0
try:
    import RPi.GPIO as GPIO
except:
    print("Cannot import GPIO lib")

ws_address = "ws://api.bounder.io:80/ws"
# ws_address = "ws://localhost:4444/ws"

ws = None


without_pixhawk = True
vehicle = None
pwm = None
gps_fixed = False
led_state = False
led_pin_index = 18

browser_location = None

programStartTime = time.time()

def decode_polygon_msg(msg):
    feature = geojson.loads(msg)
    if feature.geometry.type == 'Polygon':
        AreaHandler.polygon_geojs = msg
        with open('polygon.json', 'w') as f:
            f.write(AreaHandler.polygon_geojs)
        AreaHandler.polygon = shape(feature.geometry)
        print 'decode_polygon_msg:', AreaHandler.polygon


class AreaHandler(tornado.web.RequestHandler):

    polygon = None
    polygon_geojs = None
    is_inside = False

    def get(self):
        if AreaHandler.polygon is not None:
            self.write(AreaHandler.polygon_geojs)

    def post(self):
        decode_polygon_msg(self.request.body)

@gen.coroutine
def update_gps():
    global gps_fixed
    if vehicle is not None:
        print 'sat count:', vehicle.gps_0.satellites_visible
        location = vehicle.location.global_frame
        if vehicle.gps_0.fix_type not in [2,3]:
            print 'No GPS Fix'
            gps_fixed = False
        else:
            gps_fixed = True
            print 'vehicle gps', vehicle.gps_0, location
            point = Point(location.lon, location.lat)
    else:
        if browser_location is None or len(browser_location) < 2:
            c = [55.878512722046295, 37.61218786239625]
        else:
            c = browser_location
        t = programStartTime+time.time()
        location = LocationGlobal(c[0] + 0.00025*math.cos((t % 60)/60.0*2*math.pi),
                                  c[1] + 0.003218*math.sin((t % 60)/60.0*2*math.pi))

        point = Point(location.lon, location.lat)
        # print point
        gps_fixed = True

    if AreaHandler.polygon is not None:
        state = AreaHandler.polygon.contains(point)
        if state:
            if AreaHandler.is_inside is False:
                print 'inside'
            AreaHandler.is_inside = True
        else:
            if AreaHandler.is_inside is True:
                print 'outside'
            AreaHandler.is_inside = False

    data = dict()
    data['type'] = 'gps'
    data['timestamp'] = time.time()
    data['device_id'] = device_id
    data['polygon_geojs'] = AreaHandler.polygon_geojs
    if gps_fixed is True:
        data['lon'] = location.lon
        data['lat'] = location.lat
        data['is_inside'] = AreaHandler.is_inside
    data['fixed'] = gps_fixed

    global ws
    try:
        ws.write_message(json.dumps(data))

    except Exception as e:
        print str(e)
        try:
            print("reconnecting")
            ws = yield tornado.websocket.websocket_connect(ws_address, on_message_callback=ws_read_callback)
            # ws = websocket.WebSocket(sslopt={"cert_reqs": ssl.CERT_NONE})
            # ws.connect(ws_address)
            print('WS connected')
        except Exception as e:
            print str(e)

    global led_state

    if gps_fixed is True or without_pixhawk is True:
        if AreaHandler.is_inside is True:
            led_state = True
        else:
            led_state = not led_state
    else:
        led_state = False

    try:
        GPIO.output(led_pin_index, led_state)
    except:
        pass


def ws_read_callback(message):
    global ws
    if message is None:
        ws = None
        return
    print "Received from ws '%s'" % message
    try:
        m = json.loads(message)
        if m['type'] == 'browser_location':
            global browser_location
            browser_location = m['coords']
            print 'browser_location', browser_location
        else:
            decode_polygon_msg(message)

    except Exception as e:
        print str(e)
        try:
            from_server = json.loads(message)
            print 'server message, type ', from_server['type']
        except:
            print 'Unknown server message'

def make_app():
    return tornado.web.Application([
        (r"/geometry", AreaHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": 'html', "default_filename": "leaflet_example.html"}),
    ])


def shutdown():
    print 'exiting'
    try:
        GPIO.output(led_pin_index, False)
        GPIO.cleanup()
    except:
        pass
    tornado.ioloop.IOLoop.instance().stop()
    sys.exit()


def sig_handler(sig, frame):
    tornado.ioloop.IOLoop.instance().add_callback(shutdown)


if __name__ == "__main__":
    try:
        GPIO.cleanup()
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(led_pin_index, GPIO.OUT)
    except:
        pass

    try:
        with open('polygon.json', 'r') as file:
            AreaHandler.polygon_geojs = file.read()
            AreaHandler.polygon = shape(geojson.loads(AreaHandler.polygon_geojs).geometry)
    except Exception as e:
        print str(e)


    if without_pixhawk is False:
        vehicle = connect("/dev/ttyAMA0", baud=57600, wait_ready=True, heartbeat_timeout=20)

    app = make_app()
    p = 8888
    while(p < 9000):
        try:
            app.listen(p)
            break
        except:
            p += 1

    task = tornado.ioloop.PeriodicCallback(
            update_gps,
            200)
    task.start()



    signal.signal(signal.SIGTERM, sig_handler)
    signal.signal(signal.SIGINT, sig_handler)

    tornado.ioloop.IOLoop.current().start()

