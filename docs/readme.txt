# Bounder

Bounder (www.bounder.io) tracks drones at your event to enforce no-fly zones.
Drones are a fantastic tool when used responsibly. 
Unfortunately, accidents with drones are increasingly common, causing personal injury, threats to public safety, even power line disruptions.

Bounder is your first defense against such liabilities.

The code was developed for a proprietary project, but we have decided to open source it in the interests AI safety and safeguarding the global community.

Project by @NellWatson, @anishmohammed, and Aleksandr Tuchkov.


1. install latest Raspbian to rpi
    https://www.raspberrypi.org/downloads/raspbian/
    https://www.raspberrypi.org/documentation/installation/installing-images/README.md

2. install the latest arducopter firmware to Pixhawk (by MissionPlanner program)

3. setup RPi serial port and connect RPi to Pixhawk as described hire:
    http://dev.ardupilot.com/wiki/raspberry-pi-via-mavlink

    don't forget to test the connection http://dev.ardupilot.com/wiki/raspberry-pi-via-mavlink/#testing_the_connection
    also, don't close the ssh connection, it will be used in next steps

    Serial port on the Pixhawk will should give enough power to the Raspberry, however, I used the separate adapter.
    You can connect the battery to the Pixhawk power module to be able to walk around and test the prototype.

4. install   packages on rpi
        sudo apt-get install libgeos-c1 python-pip
        sudo pip install tornado geojson shapely dronekit

5. connect the LED with sufficient resistor to pins 12 and 14 on RPi P1 header
    http://elinux.org/RPi_Low-level_peripherals#General_Purpose_Input.2FOutput_.28GPIO.29
    these pins are marked as GPIO18 and GND on the picture

6. test the if the LED works correctly. You can use this code in python interactive mode, for example:
    import RPi.GPIO as GPIO
    GPIO.cleanup()
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(18, GPIO.OUT)
    GPIO.output(18, True)

7. Upload the bounder-io folder to the RPi

8. Run the server 
    python bounder-io-server.py

9. You should be able to load the web page at X.X.X.X:8888, where X.X.X.X is the IP address of the Raspberry.
Map will appear and it will try to center the view to your current location.
You can create a polygon on the map by using of the little toolbar on the left side.
Entered polygon is saved to the file by python server, so is will not be lost after server reboot.
After you set the polygon on the map, you can disconnect the ethernet cable from RPi and to test how system works outside.

10. LED should be 
        - turned off when there is no GPS fix,
        - flashing when you are outside the polygon
        - turned on when you are inside the polygon

11. If RPi is connected to Internet(by a cell modem, for example), you can open api.bounder.io page in any browser and see the drone movement on the map in realtime
