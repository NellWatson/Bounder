package main

import (
	"./common"
	// "errors"
	"fmt"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/jinzhu/gorm"
	// "log"
	"net/http"
	// "reflect"
	"./ws-transport"
	"strconv"
)

type VehiclePath struct {
	common.Common
	OwnerUserID int64  `json:"-" gorm:"index" sql:"index"`
	VehicleID   int64  `json:"vehicle_id" gorm:"index" sql:"index"`
	VehicleUUID string `json:"vehicle_uuid" sql:"index"`
	Name        string `json:"name" sql:"not null"`
	Comment     string `json:"comment"`
	Data        JSONB  `sql:"type:jsonb;index" json:"data"`
}

func (i VehiclePath) GetRoutes() []*rest.Route {
	return []*rest.Route{
		rest.Get("/drone_paths", func(w rest.ResponseWriter, r *rest.Request) {
			user := getAuthedUser(r)
			if user == nil {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
			} else {
				v := []VehiclePath{}
				query := DB.Where("owner_user_id = ?", user.ID)
				if vehicle_id := r.URL.Query().Get("drone_id"); len(vehicle_id) > 0 {
					query = query.Where("vehicle_id = ?", vehicle_id)
				}
				query.Find(&v)

				w.WriteJson(&v)
			}
		}),
		rest.Post("/drone_paths", func(w rest.ResponseWriter, r *rest.Request) {
			user := getAuthedUser(r)
			if user == nil {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				return
			}
			v := VehiclePath{}

			if err := r.DecodeJsonPayload(&v); err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			veh := Vehicle{}
			if err := DB.Where(Vehicle{Common: common.Common{ID: v.VehicleID}, OwnerUserID: user.ID}).First(&veh).Error; err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			veh.OwnerUser = *user

			v1 := VehiclePath{}

			if DB.Where(VehiclePath{VehicleID: v.VehicleID, OwnerUserID: user.ID}).First(&v1).RecordNotFound() == false {
				v.ID = v1.ID
			}

			v.OwnerUserID = user.ID
			v.VehicleUUID = veh.UUID

			intersectedGlobalZones := []DisallowedArea{}
			DB.Where("global=true").Where(`
		        ST_Intersects(ST_MakeValid(ST_GeomFromGeoJSON(?::JSONB->>'geometry')), 
		                      ST_MakeValid(ST_GeomFromGeoJSON(data->>'geometry'))
							  )`, v.Data).Find(&intersectedGlobalZones)

			if len(intersectedGlobalZones) > 0 {
				rest.Error(w, fmt.Sprintf("New path conflicts with global Non-Fly Zones: %+v", intersectedGlobalZones), http.StatusBadRequest)
				return
			}
			intersectedLocalZones := []DisallowedArea{}
			DB.Where(DisallowedArea{Global: false, OwnerUserID: user.ID}).Where(`
		        ST_Intersects(ST_MakeValid(ST_GeomFromGeoJSON(?::JSONB->>'geometry')), 
		                      ST_MakeValid(ST_GeomFromGeoJSON(data->>'geometry'))
							  )`, v.Data).Find(&intersectedLocalZones)

			if len(intersectedLocalZones) > 0 {
				rest.Error(w, fmt.Sprintf("New path conflicts with your Non-Fly Zones: %+v", intersectedLocalZones), http.StatusBadRequest)
				return
			}

			if err := DB.Save(&v).Error; err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			w.WriteJson(&v)

			sendCreatedPath(&veh, &v)

		}),
		rest.Delete("/drone_paths/:id", func(w rest.ResponseWriter, r *rest.Request) {
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

			deletedPath := VehiclePath{}
			DB.Where(&VehiclePath{Common: common.Common{ID: id}, OwnerUserID: user.ID}).First(&deletedPath)

			if err := DB.Where(&VehiclePath{Common: common.Common{ID: id}, OwnerUserID: user.ID}).Delete(VehiclePath{}).Error; err != nil {
				rest.Error(w, "Not found", http.StatusNotFound)
				return
			}

			veh := Vehicle{}
			if DB.Where(Vehicle{Common: common.Common{ID: deletedPath.VehicleID}}).First(&veh).RecordNotFound() == false {
				veh.OwnerUser = *user
				sendDeletedPath(&veh, &deletedPath)
			}

		}),
	}
}

func (i VehiclePath) InitDB(DB *gorm.DB) {
	DB.AutoMigrate(&VehiclePath{})

}

func (i VehiclePath) Init() {
}

func getPathMsg(cmdType string, path *VehiclePath, src *Vehicle) *ws_transport.Msg {

	return createWsMsg(cmdType, struct {
		Path *VehiclePath `json:"path"`
		UUID string       `json:"uuid"`
	}{path, src.UUID},
		src.OwnerUser)
}
func sendCreatedPath(v *Vehicle, path *VehiclePath) {
	msg := getPathMsg("update_path", path, v)
	wsTransportServer.ForwardMsgTo(msg, v.OwnerUser)
	wsTransportServer.ForwardMsg(msg)
}

func sendDeletedPath(v *Vehicle, path *VehiclePath) {
	msg := getPathMsg("delete_path", path, v)
	wsTransportServer.ForwardMsgTo(msg, v.OwnerUser)
	wsTransportServer.ForwardMsg(msg)
}

func getVehiclePath(v *Vehicle) *ws_transport.Msg {

	path := &VehiclePath{}
	if DB.Where("owner_user_id = ? and vehicle_id = ?", v.OwnerUserID, v.ID).First(&path).RecordNotFound() {
		path = nil
	}

	p := getPathMsg("update_path", path, v)
	// log.Printf("%+v", p)
	return p
}

func deletePathForVehicle(v *Vehicle) {
	deletedPath := VehiclePath{}
	DB.Where(&VehiclePath{VehicleID: v.ID}).First(&deletedPath)

	if err := DB.Where(&VehiclePath{VehicleID: v.ID}).Delete(VehiclePath{}).Error; err != nil {
		return
	}

	sendDeletedPath(v, &deletedPath)
}
