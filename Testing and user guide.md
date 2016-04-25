Testing and user guide.
=======================

I. Non-fly zones admin.
-----------------------
1. Sign up at https://api.bounder.io/admin. Administrator account should be manually approved from the server side, 
so nobody can get here without our explicit permission.
2. Log in.  You can use test account (zone_editor, zone_editor)
3. "Remember me" checkbox allows to save access token, so you will not have not enter account info after page reload.
4. After signing in you see the world map. The map is automatically tries to show your current location.
5. On the map you can see all currently existing non-fly zones.
6. You can click on the zone and then delete it with "Delete" button.
7. You can create a new zone by drawing closed polygon. To start new zone you should click on the button at top-left corner of the map.

These non-fly zones are immediately shared between all the users of the Bounder.io. You cat try to open 2 tabs in your browser both 
with admin interface and to see how it goes: if you create or delete a new zone, it will appear or disappear on the second tab and vise versa.

II. Bounder.io User guide.
--------------------------

### Device preparation:

    I recommend to use SITL technique to test our system.

    1. Prepare Ubuntu Linux machine. http://dev.ardupilot.com/wiki/setting-up-sitl-on-linux/
    2. Clone the ardupilot repo from here: https://github.com/diydrones/ardupilot
    3. Edit ardupilot/Tools/autotest/aircraft/arducopter/locations.txt to add the initial location 
    of your virtual drone.
    4. Run the simulation with bounder-io/vehicle/ubuntu_run_sitl.sh script. (you may need to edit paths). 
    It is important to set the correct IP address for the --out option. It is the address of the machine, 
    where you will run the Drone Bounder.io service (bounder-io/vehicle/mavlink_transport/vehicle-service.py). 
    It can be the same machine or another.
    5. Now you have a virtual drone with virtual Pixhawk controller on it.



Now we need to "attach" our Bounder.io device to the  drone. 
You can run the vehicle-service.py on Raspberry Pi on any other computer.
The only difference with the production configuration is that in production case we will connect Raspberry to the Pixhawk by serial interface, whereas in this testing simulation vehicle-service.py will communicate with virtual Pixhawk over network.

Open bounder-io/vehicle/mavlink_transport/settings.py and change PIXHAWK_ADDRESS to the same IP address and Port as you've set in (4).

If you want to use the physical Pixhawk instead of virtual, you can use something like /dev/ttyAMA0 (in case of using RPi)

Also, look at the bounder-io/vehicle/mavlink_transport/uuid.py file. It contains the global Bounder.io device id, which, I assume, can be printed
on the device case or a kind of paper card with this ID can be supplied with the device. It can be any string. For testing, please, 
edit the file and change this UUID to something unique.
On Linux And OS X you can use 

    uuidgen

for example.


So, at the end of this step you should have the powered on Pixhawk(physical or virtual) and bounder-io/vehicle/mavlink_transport/vehicle-service.py 
running in the terminal. If everything is ok, vehicle-service.py should output this to the terminal:

    >>> APM:Copter V3.4-dev (e5de4f23)
    >>> Frame: QUAD
    vehicle connected
    Start location:  LocationGlobal:lat=55.8122444153,lon=37.6919708252,alt=21.0900001526
    reconnecting
    WS connected
    reconnecting
    WS connected
    reconnecting
    ...

It is the correct behaviour: Bounder.io server knows nothing about this drone and rejects it's attempts to connect.

### Working with online service
1. Sign up at https://api.bounder.io and login.
2. Click on "Drones..." button and then click on "Add New Drone"
3. Enter UUID (same UUID as you've set for the test drone!), name and comment. Name and comment can be empty actually, 
but is is not too convenient to  leave them empty.


4. Now 2 things have happened: new drone block has appeared in the side panel(with "flash" icon indicating that this drone is online). 
And vehicle-service.py has stopped disconnecting and printed this (code is generated randomly, of course):   


        You should enter this code on website to activate this drone:
        6081

    It the part of 2-factor authorization, which should prevent stealing of Bounder.io modules.
    We should create a way for deliver this code to Bounder.io server and this way should guarantee, that the Bounder.io module is in the "right hands". 
    For example, this code can be transformed to sound form by the small cheap beeper inside Bounder.io module.

4. Click on Drone block, it will expand. Then click "Register". Enter the confirmation code.
You will see the success message and the drone will appear on the map. 
Also, all non-fly zones are pushed to the drone at this moment.
Some realtime telemetry is shown in the drone popup. Click on the drone icon to open this popup.
5. You can delete drones at any time with Delete btn on the side panel in each Drone block.
6. Non-fly zones can be added with the button at top-left corner of the map.
7. Non-fly zone can be deleted by clicking Delete button in non-fly zone popup. Click on the zone to open popup.
8. You can create a path for drone by clicking "Set waypoints" button in the drone's popup. If the path conflicts with non-fly zones, 
you will see the error message
9. Drone path can be deleted by clicking Delete button in drone path popup. Click on the path to open popup.
10. If the path is set, you can control the drone. Press "Arm" to arm the drone. Then press "Takeoff" to take off. 
And then press "Fly!" to fly along the path. If the drone penetrate the non-fly zone it will fly back until it leaves the zone.
You can try to create a new zone in front of flying drone to see what happens.
Also, you can press "Land on" to land on at any time. When the drone reaches the last waypoint, it will land on automatically.
11. All drone telemetry and status/error messages are saved in database. Use Log tab to explore this history.
You can select the drone from dropdown menu, enable or disable filtering of message type (all messages or statuses-only) and pick the time interval. (be careful and not pick up too huge intervals, because the system creates 3 telemetry records per second)


