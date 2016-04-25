import time
import json
import websocket
import uuid
import settings
from dronekit import connect, VehicleMode, LocationGlobal
import datetime
from tzlocal import get_localzone
import pprint
import threading
import geojson
import copy
from shapely.geometry import shape, Point, MultiPolygon
from helpers import get_distance_metres


vehicle = connect(settings.PIXHAWK_ADDRESS, baud=115200, wait_ready=True, heartbeat_timeout=200)
print('vehicle connected')

def get_start_location():
    cmds = vehicle.commands
    cmds.download()
    cmds.wait_ready()
    return vehicle.home_location

print 'Start location: ', get_start_location()
home_location = get_start_location()

vehicle.mode = VehicleMode("GUIDED")

ws = websocket.WebSocket()
nofly_polygons = []
global_nofly_polygons = []
global_multipoly = MultiPolygon()

fly_path_line = None
next_path_point = 0


M_STATE_WAITING = 0
M_STATE_RUNNING = 1
M_STATE_GOING_OUTSIDE_ZONE = 2
M_STATE_TR = {M_STATE_WAITING: 'Waiting',
              M_STATE_RUNNING: 'Running',
              M_STATE_GOING_OUTSIDE_ZONE: 'Escaping zone'}
mission_state = M_STATE_WAITING

try:
    with open('nofly_zones.json', 'r') as file:
        nofly_polygons = geojson.load(file)
except Exception as e:
    print str(e)

try:
    with open('global_nofly_polygons.json', 'r') as file:
        global_nofly_polygons = geojson.load(file)
        global_multipoly = MultiPolygon([shape(nofly_zone['data']['geometry']) for nofly_zone in global_nofly_polygons])
except Exception as e:
    print str(e)

try:
    with open('fly_path_line.json', 'r') as file:
        fly_path_line = geojson.load(file)
except Exception as e:
    print str(e)


def connect_ws():
    global ws
    ws.close()
    c = False
    while c is False:
        try:
            global mission_state, next_path_point
            mission_state = M_STATE_WAITING
            next_path_point = 0
            print("reconnecting")
            ws = websocket.WebSocket()
            ws.connect("{0}?uuid={1}".format(settings.ADDRESS, uuid.UUID))
            c = True
            print('WS connected')
        except Exception as e:
            # print e
            time.sleep(1)
            pass


connect_ws()

last_time = time.time()

telem_data = {'cmd_type': 'mavlink_state',
              'params': {
                  'nofly_zone_status': {
                      'inside': False,
                      'indexes': []
                  },
                  'mode': vehicle.mode.name,
                  'system_status': vehicle.system_status.state
              }
              }
prev_telem = None

def hold_on():
    vehicle.simple_goto(vehicle.location.global_frame)

def land_on():
    global  mission_state, next_path_point
    mission_state = M_STATE_WAITING
    next_path_point = 0
    print 'Mission finished'
    vehicle.mode = VehicleMode("LAND")

@vehicle.on_message('HWSTATUS')
def listener1(self, name, message):
    global telem_data
    telem_data['params']['vcc'] = message.Vcc / 1000.0


@vehicle.on_message('STATUSTEXT')
def listener2(self, name, message):
    # print 'STATUSTEXT', name, message.text, message.severity
    # global telem_data
    # telem_data['vcc'] = message.Vcc / 1000.0
    dt = datetime.datetime.now(get_localzone()).strftime('%Y-%m-%dT%H:%M:%S.%f%z')
    dt = dt[:-2] + ':' + dt[-2:]
    ws.send(json.dumps({'cmd_type': 'ardupilot_status', 'params':{'text': message.text, 'severity': message.severity, 'timestamp': dt}}))
    # , 'severity': message.severity


@vehicle.on_message('AUTOPILOT_VERSION')#works!
def listener3(self, name, message):
    print 'STATUSTEXT', name, message
# STATUSTEXT AUTOPILOT_VERSION AUTOPILOT_VERSION {capabilities : 2947, flight_sw_version : 50529023, middleware_sw_version : 0, os_sw_version : 0, board_version : 0, flight_custom_version : [55, 102, 49, 54, 101, 52, 100, 54], middleware_custom_version : [51, 52, 101, 49, 100, 53, 52, 51], os_custom_version : [55, 99, 53, 101, 102, 56, 56, 51], vendor_id : 0, product_id : 0, uid : 0}
# STATUSTEXT AUTOPILOT_VERSION AUTOPILOT_VERSION {capabilities : 2947, flight_sw_version : 50529023, middleware_sw_version : 0, os_sw_version : 0, board_version : 0, flight_custom_version : [55, 102, 49, 54, 101, 52, 100, 54], middleware_custom_version : [51, 52, 101, 49, 100, 53, 52, 51], os_custom_version : [55, 99, 53, 101, 102, 56, 56, 51], vendor_id : 0, product_id : 0, uid : 0}
# STATUSTEXT AUTOPILOT_VERSION AUTOPILOT_VERSION {capabilities : 2947, flight_sw_version : 50529023, middleware_sw_version : 0, os_sw_version : 0, board_version : 0, flight_custom_version : [55, 102, 49, 54, 101, 52, 100, 54], middleware_custom_version : [51, 52, 101, 49, 100, 53, 52, 51], os_custom_version : [55, 99, 53, 101, 102, 56, 56, 51], vendor_id : 0, product_id : 0, uid : 0}
# >>> APM:Copter V3.3.2 (7f16e4d6)
# >>> PX4: 34e1d543 NuttX: 7c5ef883
# >>> Frame: QUAD
# >>> PX4v2 00250023 31345118 35313935

@vehicle.on_attribute('attitude')
def attitude_listener(self, name, attitude):
    global telem_data
    telem_data['params']['attitude'] = {'pitch': attitude.pitch,
                              'roll': attitude.roll,
                              'yaw': attitude.yaw}


last_point = None
last_location = None

@vehicle.on_attribute('location')
def location_listener(self, name, location):
    global telem_data, last_point, vehicle, last_location
    telem_data['params']['location'] = {"lat": location.global_frame.lat,
                              "lon": location.global_frame.lon,
                              "alt": location.global_frame.alt}
    # print vehicle.location.global_frame
    current_point = Point(location.global_frame.lon, location.global_frame.lat)
    telem_data['params']['nofly_zone_status']['inside'] = False
    telem_data['params']['nofly_zone_status']['indexes'] = []
    for i, nofly_zone in enumerate(nofly_polygons):
        poly = shape(nofly_zone['data']['geometry'])
        if poly.contains(current_point):
            telem_data['params']['nofly_zone_status']['inside'] = True
            telem_data['params']['nofly_zone_status']['indexes'].append(nofly_zone['id'])
    further_check = False
    try:
        if global_multipoly.contains(current_point):
            further_check = True
    except:
        further_check = True
    if further_check:
        for i, nofly_zone in enumerate(global_nofly_polygons):
            poly = shape(nofly_zone['data']['geometry'])
            if poly.contains(current_point):
                telem_data['params']['nofly_zone_status']['inside'] = True
                telem_data['params']['nofly_zone_status']['indexes'].append(nofly_zone['id'])
    if telem_data['params']['nofly_zone_status']['inside'] is False:
        last_point = current_point
        last_location = location.global_frame



@vehicle.on_attribute('gps_0')
def gps_listener(self, name, gps_0):
    global telem_data
    telem_data['params']['gps_status'] = {"sat_count": gps_0.satellites_visible,
                                "fix_type": gps_0.fix_type}


@vehicle.on_attribute('heading')
def heading_listener(self, name, heading):
    global telem_data
    telem_data['params']['heading'] = heading


@vehicle.on_attribute('battery')
def batt_listener(self, name, battery):
    global telem_data
    telem_data['params']['battery'] = {'current': battery.current, 'voltage': battery.voltage}
    if telem_data['params']['battery']['current'] is None:
        telem_data['params']['battery']['current'] = 0.0


@vehicle.on_attribute('armed')
def armed_listener(self, name, armed):
    global telem_data
    telem_data['params']['armed'] = armed
    if armed is False:
        global mission_state, next_path_point
        mission_state = M_STATE_WAITING
        next_path_point = 0


@vehicle.on_attribute('system_status')
def status_listener(self, name, system_status):
    global telem_data
    telem_data['params']['system_status'] = system_status.state


@vehicle.on_attribute('mode')
def mode_listener(self, name, mode):
    global telem_data
    telem_data['params']['mode'] = mode.name


@vehicle.on_attribute('velocity')
def velocity_listener(self, name, velocity):
    global telem_data
    telem_data['params']['velocity'] = velocity

telem_data['params']['is_armable'] = vehicle.is_armable
telem_data['params']['armed'] = vehicle.armed


def save_zones():
    try:
        with open('nofly_zones.json', 'w') as file:
            geojson.dump(nofly_polygons, file)
            print 'local zones: ', [z['id'] for z in nofly_polygons]
    except Exception as e:
        print str(e)
    try:
        with open('global_nofly_polygons.json', 'w') as file:
            geojson.dump(global_nofly_polygons, file)
            print 'global zones: ', [z['id'] for z in global_nofly_polygons]
    except Exception as e:
        print str(e)


def save_path():
    try:
        with open('fly_path_line.json', 'w') as file:
            geojson.dump(fly_path_line, file)
            print 'path line: ', fly_path_line
    except Exception as e:
        print str(e)


class CmdHandler(object):
    def handle_command(self, obj):
        # print(obj)
        payload = obj['payload']

        if 'cmd_type' in payload:
            # print payload['cmd_type']
            try:
                handler =  getattr(self, payload['cmd_type'])
            except:
                print 'No handler for ', payload['cmd_type']
                return
            handler(payload['params'] if 'params' in payload else None)
        else:
            print 'command not specified. obj: ', obj

    ##########################################################

    def confirmation(self, params):
        if 'confirmation_code' in params:
            print 'You should enter this code on website to activate this drone:\n', params['confirmation_code']

    def takeoff(self, params):
        global vehicle
        if 'uuid' not in params or params['uuid'] != uuid.UUID:
            return
        alt = params['alt']
        if 0 < alt < 100:
            if vehicle.armed:
                print 'Attention! Taking off!'
                vehicle.simple_takeoff(alt)

    def arm(self, params):
        global vehicle
        if 'uuid' not in params or params['uuid'] != uuid.UUID:
            return
        arm = params['arm']
        vehicle.mode = VehicleMode("GUIDED")
        vehicle.armed = arm


    def set_mode(self, params):
        global vehicle
        if 'uuid' not in params or params['uuid'] != uuid.UUID:
            return
        mode = params['mode']
        vehicle.mode = VehicleMode(mode)

    def update_nofly_zones(self, params):
        global nofly_polygons
        nofly_polygons = params['zones']
        save_zones()

    def update_global_nofly_zones(self, params):
        global global_nofly_polygons, global_multipoly
        global_nofly_polygons = params['zones']
        global_multipoly = MultiPolygon([shape(nofly_zone['data']['geometry']) for nofly_zone in global_nofly_polygons])
        save_zones()

    def add_nofly_zones(self, params):
        global nofly_polygons
        nofly_polygons += params['zones']
        save_zones()

    def delete_nofly_zones(self, params):
        global nofly_polygons
        zones = params['zones']
        del_id = [z['id'] for z in zones]
        nofly_polygons = filter(lambda zone: zone['id'] not in del_id, nofly_polygons)
        save_zones()

    def add_global_nofly_zones(self, params):
        global global_nofly_polygons, global_multipoly
        global_nofly_polygons += params['zones']
        global_multipoly = MultiPolygon([shape(nofly_zone['data']['geometry']) for nofly_zone in global_nofly_polygons])
        save_zones()

    def delete_global_nofly_zones(self, params):
        global global_nofly_polygons, global_multipoly
        zones = params['zones']
        del_id = [z['id'] for z in zones]
        global_nofly_polygons = filter(lambda zone: zone['id'] not in del_id, global_nofly_polygons)
        global_multipoly = MultiPolygon([shape(nofly_zone['data']['geometry']) for nofly_zone in global_nofly_polygons])
        save_zones()

    def ping(self, params):
        ws.send(json.dumps({'cmd_type': 'pong'}))

    def get_nofly_zones(self, params):
        global nofly_polygons
        if 'uuid' not in params or params['uuid'] != uuid.UUID:
            return
        ws.send(json.dumps({'cmd_type': 'current_nofly_zones', 'params':{'zones': geojson.dumps(nofly_polygons)}}))

    def get_global_nofly_polygons(self, params):
        global global_nofly_polygons
        if 'uuid' not in params or params['uuid'] != uuid.UUID:
            return
        ws.send(json.dumps({'cmd_type': 'current_global_nofly_zones', 'params':{'zones': geojson.dumps(global_nofly_polygons)}}))

    def telemetry_format_error(self, params):
        print "server error: ", params['server_message']

    def server_goodbye(self, params):
        print 'Server said goodbye'

    def start_mission(self, params):
        if 'uuid' not in params or params['uuid'] != uuid.UUID:
            return
        global mission_state, next_path_point
        global home_location
        home_location = get_start_location()

        next_path_point = 0
        mission_state = M_STATE_RUNNING
        vehicle.simple_goto(get_path_point())
        print 'Mission started!'

    def land_on(self, params):
        if 'uuid' not in params or params['uuid'] != uuid.UUID:
            return
        print 'land_on', params
        global mission_state, next_path_point
        mission_state = M_STATE_WAITING
        next_path_point = 0
        vehicle.mode = VehicleMode("LAND")


    def update_path(self, params):
        if 'uuid' not in params or params['uuid'] != uuid.UUID:
            return
        global fly_path_line
        fly_path_line = params['path']
        save_path()
        global mission_state, next_path_point
        next_path_point = 0
        mission_state = M_STATE_WAITING

    def delete_path(self, params):
        if 'uuid' not in params or params['uuid'] != uuid.UUID:
            return
        global fly_path_line
        fly_path_line = None
        save_path()
        global mission_state, next_path_point
        mission_state = M_STATE_WAITING
        next_path_point = 0

    def get_path(self, params):
        if 'uuid' not in params or params['uuid'] != uuid.UUID:
            return
        ws.send(json.dumps({'cmd_type': 'current_path', 'params':{'path': geojson.dumps(fly_path_line)}}))

class ReadThread(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        self.handler = CmdHandler()

    def run(self):
        while True:
            try:
                if ws.connected:
                    obj = None
                    d = ws.recv()
                    if d != '':
                        try:
                            obj = json.loads(d)
                        except Exception as e:
                            print e, ' data: ', d
                            continue
                    if obj is not None:
                        self.handler.handle_command(obj)
                else:
                    time.sleep(1)
            except Exception as e:
                if 'argument' not in str(e):
                    print 'WS Receive exception: ', e


thread = ReadThread()
thread.start()

def incr_path_point():
    global next_path_point
    if fly_path_line is not None:
        coords = fly_path_line['data']['geometry']['coordinates']
        if len(coords) > next_path_point:
            next_path_point += 1
            return True
    return False


def decr_path_point():
    global next_path_point
    if fly_path_line is not None and len(fly_path_line['data']['geometry']['coordinates']) > 0:
        if next_path_point > -1:
            next_path_point -= 1
    else:
        next_path_point = -1
    return True


def is_inside_nonfly():
    return telem_data['params']['nofly_zone_status']['inside'] == True


def get_path_point():
    if next_path_point == -1 or fly_path_line is None or len(fly_path_line['data']['geometry']['coordinates']) == 0:
        return get_start_location()
    elif next_path_point >= len(fly_path_line['data']['geometry']['coordinates']):
        return None
    else:
        coords = fly_path_line['data']['geometry']['coordinates']
        return LocationGlobal(coords[next_path_point][1], coords[next_path_point][0],
                              home_location.alt + 10)

class ControlThread(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)

    def run(self):
        global mission_state
        while True:
            if is_inside_nonfly():
                if vehicle.armed and vehicle.system_status.state is "ACTIVE":
                    if mission_state == M_STATE_RUNNING:
                        mission_state = M_STATE_GOING_OUTSIDE_ZONE
                        decr_path_point()
                        vehicle.simple_goto(get_path_point())

            if mission_state == M_STATE_RUNNING:
                if get_path_point() is None:
                    land_on()
                else:
                    dist = get_distance_metres(vehicle.location.global_frame,
                                               get_path_point())
                    if dist < 5:
                        incr_path_point()
                        if get_path_point() is None:
                            land_on()
                        else:
                            vehicle.simple_goto(get_path_point())

            if mission_state == M_STATE_GOING_OUTSIDE_ZONE:
                if is_inside_nonfly():
                    print 'going outside'
                    dist = get_distance_metres(vehicle.location.global_frame,
                                               get_path_point())
                    if dist < 5:
                        decr_path_point()
                        vehicle.simple_goto(get_path_point())

                else:
                    mission_state = M_STATE_WAITING
                    print 'we are outside, waiting'
                    hold_on()

            time.sleep(0.6)


cmd_thread = ControlThread()
cmd_thread.start()


while True:
    time.sleep(settings.SEND_DELAY)
    last_time = time.time()
    dt = datetime.datetime.now(get_localzone()).strftime('%Y-%m-%dT%H:%M:%S.%f%z')
    dt = dt[:-2] + ':' + dt[-2:]
    telem_data['params']['timestamp'] = dt
    telem_data['params']['is_armable'] = vehicle.is_armable
    telem_data['params']['mission_state'] = M_STATE_TR[mission_state]
    telem_data['params']['next_point'] = next_path_point
    # to_send =  copy.deepcopy(telem_data)
    # if prev_telem != None:
    #     for k in telem_data['params']:
    #         if k in prev_telem['params'] and prev_telem['params'][k] == telem_data['params'][k]:
    #             del to_send['params'][k]
    try:
        pass
        # print to_send
        t = json.dumps(telem_data)
        ws.send(t)
        # prev_telem = copy.deepcopy(telem_data)
        # pprint.pprint(telem_data)
    except Exception as e:
        if 'argument' not in str(e):
            print 'WS Send exception: ', e
        connect_ws()
