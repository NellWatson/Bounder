package main

import (
	"./common"
	"./ws-transport"
	"errors"
	"fmt"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/jinzhu/gorm"
	"log"
	"net/http"
	// "reflect"
	"math/rand"
	"strconv"
)

type Vehicle struct {
	common.Common
	UUID             string `json:"uuid" gorm:"index"`
	OwnerUserID      int64  `json:"-" gorm:"index" sql:"index"`
	Name             string `json:"name" sql:"not null"`
	Comment          string `json:"comment"`
	Active           bool   `json:"active"`
	Online           bool   `json:"online"`
	SelfUserID       int64  `json:"-" gorm:"index" sql:"index"`
	ConfirmationCode string `json:"-"`
	Deleted          bool   `json:"-" gorm:"-"`
	OwnerUser        User   `json:"-" gorm:"-"`
}

type WSMsg struct {
	CmdType string      `json:"cmd_type"`
	Params  interface{} `json:"params"`
}

func createWsMsg(cmd string, cmdParamsStruct interface{}, src ws_transport.Entity) *ws_transport.Msg {
	return &ws_transport.Msg{
		SrcEntity: src,
		Payload:   WSMsg{cmd, cmdParamsStruct},
	}
}

func (i *Vehicle) CreateFromRequest(r *http.Request) (ws_transport.Entity, error) {
	uuid := r.FormValue("uuid")

	if uuid != "" {
		// log.Println("HERE")
		vehicle := Vehicle{}
		if DB.Where(&Vehicle{UUID: uuid}).First(&vehicle).Error == nil {
			usr := User{}
			if DB.Where(&User{Common: common.Common{ID: vehicle.OwnerUserID}}).First(&usr).Error == nil {
				vehicle.OwnerUser = usr

				return &vehicle, nil
			}

		} else {
			vehicle.UUID = uuid
			vehicle.Active = false
		}
	}
	return nil, errors.New("Not found")
}

func (i *Vehicle) Id() string {
	return fmt.Sprintf("vehicle%v", i.ID)
}

func (i *Vehicle) Type() int {
	return ws_transport.EntityNormal
}

func (i *Vehicle) Enabled() bool {
	return i.Active
}

func (i *Vehicle) NonExists() bool {
	return i.Deleted
}

var vehicleEntityUpdateChannel chan ws_transport.EntityUpdate = make(chan ws_transport.EntityUpdate)

func (i *Vehicle) UpdateChan() chan ws_transport.EntityUpdate {
	return vehicleEntityUpdateChannel
}

func (i *Vehicle) UpdateOnlineStatus(status bool) (toForward *ws_transport.Msg, toSelf []*ws_transport.Msg) {
	i.Online = status
	//i.ConfirmationCode = "1234" //TODO
	DB.Save(&i)

	toForward = createWsMsg(
		"drone_changed",
		struct {
			Vehicle Vehicle `json:"vehicle"`
		}{*i},
		i,
	)
	toSelf = []*ws_transport.Msg{}
	if status {
		if i.Active {
			toSelf = append(toSelf, getUserNoFlyZones(&i.OwnerUser))
			toSelf = append(toSelf, getGlobalNoFlyZones())
			toSelf = append(toSelf, getVehiclePath(i))
		} else {
			toSelf = append(toSelf, createWsMsg(
				"confirmation",
				map[string]interface{}{"confirmation_code": i.ConfirmationCode},
				i,
			),
			)
		}
	}
	// vehicleEntityUpdateChannel <- i
	return
}

func (i Vehicle) GetRoutes() []*rest.Route {
	return []*rest.Route{
		rest.Get("/vehicles", func(w rest.ResponseWriter, r *rest.Request) {
			user := getAuthedUser(r)
			if user == nil {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
			} else {
				v := []Vehicle{}
				DB.Where(&Vehicle{OwnerUserID: user.ID}).Find(&v)

				w.WriteJson(&v)
			}
		}),
		rest.Post("/vehicles", func(w rest.ResponseWriter, r *rest.Request) {
			user := getAuthedUser(r)
			if user == nil {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				return
			}
			v := Vehicle{}
			if err := r.DecodeJsonPayload(&v); err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			if !DB.Where(&Vehicle{UUID: v.UUID}).Find(&Vehicle{}).RecordNotFound() {
				rest.Error(w, "This UUID is already registered", http.StatusBadRequest)
				return
			}
			v.OwnerUserID = user.ID
			v.ConfirmationCode = fmt.Sprintf("%d", rand.Intn(9000)+1000) //"1234" //TODO
			if err := DB.Save(&v).Error; err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			if err := createBidirLink(user, &v); err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			w.WriteJson(&v)
		}),
		rest.Delete("/vehicles/:id", func(w rest.ResponseWriter, r *rest.Request) {
			user := getAuthedUser(r)
			if user == nil {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				return
			}
			id, err := strconv.ParseInt(r.PathParam("id"), 10, 64)
			if err != nil {
				rest.Error(w, "Bad request", http.StatusBadRequest)
				return
			}
			v := Vehicle{Common: common.Common{ID: id}}
			DB.Find(&v)
			if err := DB.Unscoped().Where(&Vehicle{OwnerUserID: user.ID}).Delete(&v).Error; err != nil {
				rest.Error(w, "Not found", http.StatusNotFound)
				return
			}
			v.Deleted = true
			v.OwnerUser = *user
			deletePathForVehicle(&v)
			DB.Where(&VehiclePath{VehicleID: v.ID, OwnerUserID: user.ID}).Delete(VehiclePath{})

			removeEntity(&v)

			vehicleEntityUpdateChannel <- ws_transport.EntityUpdate{&v, make(chan bool)}
		}), rest.Post("/register_vehicle", func(w rest.ResponseWriter, r *rest.Request) {
			user := getAuthedUser(r)
			if user == nil {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				return
			}
			type RegInfo struct {
				UUID             string `json:"uuid"`
				ConfirmationCode string `json:"confirmation_code"`
			}
			info := RegInfo{}
			if err := r.DecodeJsonPayload(&info); err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			vehicle := Vehicle{}

			if DB.Where(&Vehicle{UUID: info.UUID}).First(&vehicle).RecordNotFound() {
				rest.Error(w, "StatusNotFound", http.StatusNotFound)
				log.Println("not found")
				return
			}

			if vehicle.ConfirmationCode != info.ConfirmationCode {
				rest.Error(w, "Code is wrong", http.StatusBadRequest)
				log.Printf("Code is wrong: %+v, %+v", vehicle, info)
				return
			}
			vehicle.Active = true

			if err := DB.Save(&vehicle).Error; err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			upd := ws_transport.EntityUpdate{&vehicle, make(chan bool)}
			vehicleEntityUpdateChannel <- upd
			<-upd.Feedback
			log.Println("<-upd.Feedback")

			w.WriteJson(&vehicle)
			//error! vehicleEntityUpdateChannel delivers changes too late and new messages are rejected!
			wsTransportServer.ForwardMsgTo(getUserNoFlyZones(user), &vehicle)
			wsTransportServer.ForwardMsgTo(getGlobalNoFlyZones(), &vehicle)
			wsTransportServer.ForwardMsgTo(getVehiclePath(&vehicle), &vehicle)
		}),
	}
}

func (i Vehicle) InitDB(DB *gorm.DB) {
	DB.AutoMigrate(&Vehicle{})

}

func (i Vehicle) Init() {
}

func (i *Vehicle) HandleIncomingMsg(msg *ws_transport.Msg) (toForward *ws_transport.Msg, toSelf *ws_transport.Msg, stopPropagation bool) {
	// log.Printf("This vehicle %v sent a message and we need to handle\n", i.Id())
	stopPropagation = false
	toForward = nil
	toSelf = nil

	type t struct {
		Type          string `json:"cmd_type"`
		ServerMessage string `json:"server_message"`
	}

	if err := AddTelemetryFromMsg(msg); err != nil {
		stopPropagation = true
		toSelf = createWsMsg(
			"telemetry_format_error",
			struct {
				ServerMessage string `json:"server_message"`
			}{err.Error()},
			i,
		)

	}
	return
}
