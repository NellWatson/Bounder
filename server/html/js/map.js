function initMap() {
    var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib, detectRetina: true }),
        map = new L.Map('map', { layers: [osm], center: new L.LatLng(-37.7772, 175.2756), zoom: 15 });

    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    var drawControl = new L.Control.Draw({
        draw: {
            position: 'topleft',
            polygon: {
                allowIntersection: false,
                drawError: {
                    color: '#b00b00',
                    timeout: 1000
                },
                showArea: true
            },
            polyline: false,
            marker: false,
            rectangle: false,
            circle: false
        }
    });
    map.addControl(drawControl);

    map.polygonDrawer = new L.Draw.Polyline(map, {
        shapeOptions: {
            color: "#00DD00"
        }
    });

    map.startPathDrawing = function() {

    }

    map.on('draw:created', function(e) {
        var type = e.layerType,
            layer = e.layer;

        if (type === 'polygon') {
            // console.log(layer.toGeoJSON())
            map.OnZoneCreated(layer.toGeoJSON())
        } else if (type === 'polyline') {
            map.OnPathCreated(layer.toGeoJSON())
        }

    });

    var browserCoords;

    var droneGraphics = {};

    var marker;
   


    var geo_options = {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
    };

    navigator.geolocation.getCurrentPosition(success, error, geo_options);



    function success(position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var altitude = position.coords.altitude;
        var accuracy = position.coords.accuracy;

        browserCoords = [latitude, longitude];

        if (marker == undefined) {
            var redMarker = L.AwesomeMarkers.icon({
                // icon: 'home',
                icon: 'user',
                markerColor: 'red'
            });
            marker = L.marker(browserCoords, { icon: redMarker }).addTo(map);
        } else
            marker.setLatLng(browserCoords);
        marker.bindPopup("Your location");


        map.setZoom(15);
        map.panTo([latitude, longitude])
    }

    function error(error) {
        alert("Unable to retrieve your location due to " + error.code + " : " + error.message);
    };

    map.droneMarkers = ({});
    map.dronePaths = ({});
    map.pathPolylines = ({});

    map.zonePolygons = ({});

    map.localZones = ({});
    map.globalZones = ({});

    map.currentDroneMarker = null;
    map.displayDrones = function(telemetry) {
        for (drone_id in telemetry) {
            var dr = telemetry[drone_id].telem
            if (map.droneMarkers[drone_id] == undefined) {
                // var blueMarker = L.AwesomeMarkers.icon({
                //     // icon: 'home',
                //     icon: 'fighter-jet',
                //     markerColor: 'blue',
                //     prefix: 'fa',
                //     spin: false
                // });

                var blueMarker = L.icon({
                     iconUrl: 'css/images/drone.png',
                    iconRetinaUrl: 'css/images/drone.png',
                    iconSize:     [48, 48],
                    shadowSize:   [0, 0],
                    iconAnchor:   [24, 24],
                    shadowAnchor: [0, 0],
                    popupAnchor:  [-15, -15]
                });

                map.droneMarkers[drone_id] = L.marker([dr.location.lat, dr.location.lon], { icon: blueMarker, iconAngle: dr.heading-45 }).addTo(map);
                map.droneMarkers[drone_id].bindPopup(telemetry[drone_id].drone_info.name);
                map.droneMarkers[drone_id].on('dblclick', function(e) {
                    // if (map.currentDroneMarker != null) {
                    //     map.currentDroneMarker.setIcon(L.AwesomeMarkers.icon({
                    //         // icon: 'home',
                    //         icon: 'fighter-jet',
                    //         markerColor: 'blue',
                    //         prefix: 'fa',
                    //         spin: false
                    //     }));
                    // }
                    // map.currentDroneMarker = this;
                    // map.currentDroneMarker.setIcon(L.AwesomeMarkers.icon({
                    //     // icon: 'home',
                    //     icon: 'fighter-jet',
                    //     markerColor: 'blue',
                    //     prefix: 'fa',
                    //     spin: false,
                    //     iconColor: '#00FF00'
                    // }));
                    map.OnCurrentDroneChanged(this.drone)
                });
            }
            // console.log('telemetry[drone_id].drone_info.path', telemetry[drone_id].drone_info.path)


            map.droneMarkers[drone_id].setIconAngle(dr.heading-45)

            map.droneMarkers[drone_id].setLatLng([dr.location.lat, dr.location.lon]);
            dr.name = telemetry[drone_id].drone_info.name;
            dr.drone_info = telemetry[drone_id].drone_info
            dr.zones_verb = JSON.stringify(dr.nofly_zone_status.indexes)
            map.droneMarkers[drone_id].setPopupContent(map.DronePopupCallback(dr));
            map.droneMarkers[drone_id].drone = telemetry[drone_id]


            // map.droneMarkers[drone_id].bindPopup(map.DronePopupCallback(dr));

            // console.log(telemetry[drone_id].drone_info.name, [dr.location.lat, dr.location.lon])
        }
    }
    map.loadNoFlyZones = function(zones) {
        for (var i = 0; i < zones.length; i++) {

            map.addZone(zones[i]);
        }
    }
    map.deleteNoFlyZones = function(zones) {
        for (var i = 0; i < zones.length; i++) {
            map.deleteZone(zones[i].id);
        }
    }

    map.addZone = function(zone) {
        var polygonData = zone.data;
        var coord = [];
        $.each(polygonData.geometry.coordinates[0], function(index, value) {
            coord.push([value[1], value[0]])
        });
        //                       if(droneGraphics[conn_id].currentPolygon != undefined)
        //                         map.removeLayer(droneGraphics[conn_id].currentPolygon);
        var polygon = L.polygon(coord, { color: (zone.is_global == true ? "#FF0000" : "#0000FF"), opacity: 0.5, dashArray: "10, 5" }).addTo(map);
        polygon.DB_id = zone.id
        polygon.on('click', function(e) {
            map.openPopup(map.ZonePopupCallback(zone), e.latlng);

        });
        map.zonePolygons[zone.id] = polygon

        if (zone.is_global) map.globalZones[zone.id] = zone;
        else map.localZones[zone.id] = zone;
        //                       console.log('polygon updated from ws:', coord)
    }

    map.setDronePath = function(path) {
        if (map.dronePaths[path.id] != undefined) {
            map.deleteDronePath(path)
        }
        map.dronePaths[path.id] = path;

        var polylineData = path.data;
        var coord = [];

        $.each(polylineData.geometry.coordinates, function(index, value) {
            // console.log('value: ', JSON.stringify(value))
            coord.push([value[1], value[0]])
        });
        //                       if(droneGraphics[conn_id].currentPolygon != undefined)
        //                         map.removeLayer(droneGraphics[conn_id].currentPolygon);
        var polyline = L.polyline(coord, { color: "#101010", opacity: 0.5 }).addTo(map);

        var label = L.marker(coord[0], {
            icon: L.divIcon({
                className: 'label',
                html: '<div style="color:red;">Path for drone <br>' + path.drone.name + '</div>',
                iconSize: [100, 40]
            })
        }).addTo(map);


        polyline.DB_id = path.id
        polyline.on('click', function(e) {
            // console.log(JSON.stringify(path))
            map.openPopup(map.DronePathPopupCallback(path), e.latlng);

        });
        polyline.label = label
        map.pathPolylines[path.id] = polyline;
    }
    map.deleteDronePath = function(path) {
        delete map.dronePaths[path.id];
        map.removeLayer(map.pathPolylines[path.id]);
        map.removeLayer(map.pathPolylines[path.id].label);
        delete map.pathPolylines[path.id];
        map.closePopup();
    }

    map.deleteDroneLabel = function(drone_id) {
        if (drone_id in map.droneMarkers) {
            map.removeLayer(map.droneMarkers[drone_id]);
            delete map.droneMarkers[drone_id];
        }
    }
    map.deleteZone = function(id) {
        if (id in map.localZones) {

            map.removeLayer(map.zonePolygons[id]);
            delete map.zonePolygons[id];
            map.closePopup();
            delete map.localZones[id];

        } else if (id in map.globalZones) {

            map.removeLayer(map.zonePolygons[id]);
            delete map.zonePolygons[id];
            map.closePopup();
            delete map.globalZones[id]

        }
    }

    map.OnZoneCreated = function(zone) {
        console.log('zone created:', zone);
    };

    map.SetGlobalZones = function(zones) {
        for (zi in map.globalZones) {
            map.removeLayer(map.zonePolygons[zi]);
            delete map.zonePolygons[zi];
            map.closePopup();

        }
        map.globalZones = ({});
        for (var i = 0; i < zones.length; i++) {
            map.addZone(zones[i])
        }
    }
    map.SetZones = function(zones) {
        for (zi in map.localZones) {
            map.removeLayer(map.zonePolygons[zi]);
            delete map.zonePolygons[zi];
            map.closePopup();

        }
        map.localZones = ({});
        for (var i = 0; i < zones.length; i++) {
            map.addZone(zones[i])
        }
    }

    map.ZonePopupCallback = function(zone) {
        return "NonFly Zone#" + zone.id;
    }
    return map;
}
