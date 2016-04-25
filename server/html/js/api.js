function API() {
    console.log(window.location.protocol)
    this.host = (window.location.protocol == "https:" ? "wss://" : "ws://") + window.location.host + "/ws";
    _this_obj = this;
    this.onError = function(err) {
        console.log(err)
    }
    this.login = function(email, password) {
        return _this_obj.post('login', {
                username: email,
                password: password
            })
            .success(function(data) {
                _this_obj.setToken(data.token)

            });

    }
    this.logOut = function() {

            _this_obj.setToken("")
        }
        //public methods
    this.sendObject = function(val) {
        if (_this_obj.socket != null) {
            _this_obj.socket.send(JSON.stringify(val));
        } else {
            console.log(' not connected, cannot send data')
        }
    }
    this.isLoggedIn = function() {
            return localStorage.getItem("token") == "";
        }
        //overridable
        //device connection
    this.onLoggedIn = function(user) {
        console.log('onLoggedIn default handler: ', user);
    }
    this.onLoggedOut = function() {
        console.log('onLoggedOut default handler');
    }

    this.onConnected = function() {
        // console.log('connected default handler');
    }
    this.onDisconnected = function() {
        // console.log('disconnected default handler');
    }
    this.onKicked = function() {
        console.log('kicked default handler');
    }

    this.onRawMessage = function(val) {
        // console.log('Raw msg default handler: ' + val);
    }
    this.onTelemetryUpdate = function(vehicle_id, timestamp, tel_data) {
            console.log('RonTelemetryUpdate default handler: ', vehicle_id, timestamp, JSON.stringify(tel_data));
        }
        //////////////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////////////

    this.setToken = function(token_str) {
        console.log("Bounder.io:  token set:", token_str)
        if (token_str == "") {
            //     if(_this_obj != undefined && _this_obj.socket != undefined)
            //       _this_obj.socket.close();
            //     _this_obj.socket = null;
            //     // $.ajaxSetup({headers: {"Authorization": ""}})
            localStorage.setItem("token", "");
            console.log("Logged out")
            _this_obj.onLoggedOut()
            window.clearInterval(_this_obj.int_id)
            if (_this_obj.socket != null && _this_obj.socket.readyState != _this_obj.socket.CLOSED) {
                _this_obj.socket.close();
            }
        } else {
            _this_obj.token = token_str
            _this_obj.get('users')
                .success(
                    function(data) {
                        localStorage.setItem("token", _this_obj.token);
                        // console.log(data);

                        _this_obj.onLoggedIn(data);
                        _this_obj.connWs();
                        _this_obj.int_id = window.setInterval(_this_obj.hostTimeout1, 1000);
                    
                    }

                );

        }
    }
    this.signUp = function(email, password) {
        return _this_obj.post('users', {
                login: email,
                plaintextPassword: password,
                roles: [{
                    name: "stub"
                }]
            })
            .success(function(data) {
                _this_obj.login(email, password);
                console.log('logging in');
            });
    }
    this.tryResumeSession = function() {
            _this_obj.setToken(localStorage.getItem("token"));

        }
        //internal
    this.addDrone = function(uuid, name, comment) {
        return _this_obj.post('vehicles', {
                uuid: uuid,
                name: name,
                comment: comment

            })
            .success(function(data) {
                _this_obj.onDroneAdded(data)
            });
    }
    this.onDroneAdded = function(data) {
        console.log("Drone added: ", data)
    }

    this.deleteDrone = function(drone_id) {
        return _this_obj.delete('vehicles/' + drone_id)
            .success(function(data) {
                _this_obj.onDroneDeleted(data)
            });

    }
    this.onDroneDeleted = function(id) {
        console.log("Drone deleted: ", id)
    }

    this.getDrones = function() {
        return _this_obj.get('vehicles')
    }

    this.getNoFlyZones = function() {
        return _this_obj.get('disallowed_zones')
    }

    this.saveNoFlyZone = function(zone_data) {
        return _this_obj.post('disallowed_zones', {
            data: zone_data
        });
    }

    this.deleteNoFlyZone = function(zone_id) {
        return _this_obj.delete('disallowed_zones/' + zone_id);
    }

    this.getGlobalNoFlyZones = function() {
        return _this_obj.get('global_disallowed_zones')
    }

    this.saveGlobalNoFlyZone = function(zone_data) {
        return _this_obj.post('global_disallowed_zones', {
            data: zone_data
        });
    }

    this.deleteGlobalNoFlyZone = function(zone_id) {
        return _this_obj.delete('global_disallowed_zones/' + zone_id);
    }

    this.saveDronePath = function(path_data, id) {
        return _this_obj.post('drone_paths', {
            data: path_data,
            vehicle_id: id
        });
    }
    this.deleteDronePath = function(id) {
        return _this_obj.delete('drone_paths/'+id);
    }

    this.getPaths = function() {
        return _this_obj.get('drone_paths');
    }

    this.registerDrone = function(uuid, confirmation_code) {
        return _this_obj.post('register_vehicle', {
            uuid: String(uuid),
            confirmation_code: String(confirmation_code)

        });
    }
    this.getTelemetryHistory = function(vehicle_id, from, to, filter) {
        var prm = {};
        prm.vehicle_id = vehicle_id;
        if(from != undefined)prm.from = from;
        if(to != undefined)prm.to = to;
        if(filter != undefined)prm.filter = filter;
        return _this_obj.get('telemetry_records', prm)
    }
    this.getCommandsHistory = function(vehicle_uuid, from, to) {
         var prm = {};
        if(vehicle_uuid != undefined)prm.vehicle_uuid = vehicle_uuid;
        if(from != undefined)prm.from = from;
        if(to != undefined)prm.to = to;

        return _this_obj.get('user_commands', prm)
    }

    this.onDroneChanged = function(drone) {
        console.log("Drone changed: ", drone)
    }

    this.onTelemetry = function() {
        
    }

    this.onGlobalZones = function(zones) {

    }


    this.sendMsg = function(id, msg) {
        _this_obj.sendObject({ 'ffuuuu': 'f' })
    }

    this.setArmed = function(armed, uuid) {
        _this_obj.sendObject({cmd_type: 'arm', params:{arm: armed, uuid: uuid}})
    }

    this.takeoff = function(uuid) {
        _this_obj.sendObject({cmd_type: 'takeoff', params:{uuid: uuid, alt:10}})
    }

    this.startMission = function(uuid) {
        _this_obj.sendObject({cmd_type: 'start_mission', params:{uuid: uuid}})
    }
    this.landOn = function(uuid) {
        _this_obj.sendObject({cmd_type: 'land_on', params:{uuid: uuid}})
    }
    this.setMode = function(mode, uuid) {
        _this_obj.sendObject({cmd_type: 'set_mode', params:{mode: mode, uuid: uuid}})
    }
    
    
    this.MessageHandler = function(msg) {
        obj = JSON.parse(msg.data);
        _this_obj.onRawMessage(msg.data);

        if (obj.payload.cmd_type in _this_obj.commands) {
            _this_obj.commands[obj.payload.cmd_type](obj)
        } else
            console.log("Unknown WS msg:", msg.data)

    }
    this.connWs = function() {
        if (_this_obj.socket != null) _this_obj.socket.close()
        try {
            _this_obj.socket = new WebSocket(_this_obj.host + "?token=" + _this_obj.token);


        } catch (ex) {

        }
        _this_obj.socket.onerror = function(event) {
            console.log("WS Error: ", event);
        }

        _this_obj.socket.onopen = function() {
            console.log('WS connection opened')
            _this_obj.onConnected();
        };
        _this_obj.socket.onclose = function() {
            console.log('WS connection closed')
            console.log(new Date())
            _this_obj.onDisconnected();
            // _this_obj.connWs();
        };
        _this_obj.socket.onmessage = this.MessageHandler;
    }
    this.hostTimeout1 = function() {

        if (_this_obj.socket == null || _this_obj.socket.readyState == _this_obj.socket.CLOSED) {

            console.log(" reconnecting");
            _this_obj.connWs()

        }
    }
    this.hostTimeout2 = function() {
        if (_this_obj.socket.readyState == _this_obj.socket.OPEN) {
            _this_obj.socket.send('{"cmd_type":"ping"}');
        }

    }
    this.post = function(endpoint, obj) {
        return $.ajax({
            type: "POST",
            url: "api/" + endpoint,
            data: JSON.stringify(obj),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            headers: {
                Authorization: "Bearer " + _this_obj.token
            },
            error: function(err) {
                _this_obj.onError(err.responseText)
            }

        });
    }
    this.get = function(endpoint, query_args) {
        return $.ajax({
            url: "api/" + endpoint,
            data: query_args,
            headers: {
                "Authorization": "Bearer " + _this_obj.token
            },
            error: function(err) {
                console.log(err)
                _this_obj.onError(err.responseText)
            }
        })
    }
    this.delete = function(endpoint) {
        return $.ajax({
            type: "DELETE",
            url: "api/" + endpoint,
            headers: {
                "Authorization": "Bearer " + _this_obj.token
            },
            error: function(err) {
                console.log(err)
                _this_obj.onError(err.responseText)
            }
        })
    }

    _this_obj.socket = null
    // _this_obj.int_id = window.setInterval(_this_obj.hostTimeout2, 5000);

    _this_obj.drones_telemetry = ({});
    this.commands = {
        drone_changed: function(obj) {
            console.log('Vehicle ', obj.payload.params.vehicle.id, ' goes ', obj.payload.params.vehicle.online ? 'online': 'offline')
            if(!obj.payload.params.vehicle.online) {
                if(obj.payload.params.vehicle.id in _this_obj.drones_telemetry)
                    delete _this_obj.drones_telemetry[obj.payload.params.vehicle.id];
            }
            _this_obj.onDroneChanged(obj.payload.params.vehicle)
        },
        ping: function(obj) {
            //_this_obj.onDroneChanged(obj.vehicle)
        },
        server_message: function(obj) {
            //_this_obj.onDroneChanged(obj.vehicle)
        },
        mavlink_state: function(obj) {
            // console.log('mavlink_state: ', obj)
            _this_obj.drones_telemetry[obj.source_entity.id] = {telem: obj.payload.params, drone_info: obj.source_entity}
            _this_obj.onTelemetry()
        },
        pong: function(obj) {
            // console.log('mavlink_state: ', obj)
        },
        update_global_nofly_zones: function(obj) {
            console.log('update_global_nofly_zones:', obj.payload.params.zones)
            _this_obj.onGlobalZones(obj.payload.params.zones)
        },
        delete_global_nofly_zones: function(obj) {
            console.log('delete_global_nofly_zones:', obj.payload.params.zones)
            _this_obj.onDeleteGlobalZones(obj.payload.params.zones)
        },
        add_global_nofly_zones: function(obj) {
            console.log('add_global_nofly_zones:', obj.payload.params.zones)
            _this_obj.onAddGlobalZones(obj.payload.params.zones)
        },
        delete_nofly_zones: function(obj) {
            console.log('delete_nofly_zones:', obj.payload.params.zones)
            _this_obj.onDeleteZones(obj.payload.params.zones)
        },
        add_nofly_zones: function(obj) {
            console.log('add_nofly_zones:', obj.payload.params.zones)
            _this_obj.onAddZones(obj.payload.params.zones)
        },
        transport_error: function(obj) {
            // console.log('transport_error:', obj.payload.error)
        },
        user_command_format_error: function(obj) {
         console.log('user_command_format_error:', obj.payload.params.server_message)
        },
        update_path: function(obj) {
            _this_obj.onUpdatePath(obj.payload.params.path)
        },
        delete_path: function(obj) {
            _this_obj.onDeletePath(obj.payload.params.path)
        },
        ardupilot_status: function(obj) {
            console.log('Ardupilot msg: ', obj.payload.params.text)
        },
    }


}

var API = new API();
