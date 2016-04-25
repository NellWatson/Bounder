package main

import (
	"./common"
	// "errors"
	// "fmt"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/jinzhu/gorm"
	// "log"
	"net/http"
	// "reflect"
	"./ws-transport"
	"strconv"
)

type DisallowedArea struct {
	common.Common
	OwnerUserID int64  `json:"-" gorm:"index" sql:"index"`
	Name        string `json:"name" sql:"not null"`
	Comment     string `json:"comment"`
	Active      bool   `json:"active"`
	Data        JSONB  `sql:"type:jsonb;index" json:"data"`
	Global      bool   `json:"is_global"`
}

func (i DisallowedArea) GetRoutes() []*rest.Route {
	return []*rest.Route{
		rest.Get("/disallowed_zones", func(w rest.ResponseWriter, r *rest.Request) {
			user := getAuthedUser(r)
			if user == nil {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
			} else {
				v := []DisallowedArea{}
				DB.Where("owner_user_id = ?", user.ID).Find(&v)

				w.WriteJson(&v)
			}
		}),
		rest.Get("/global_disallowed_zones", func(w rest.ResponseWriter, r *rest.Request) {
			v := []DisallowedArea{}
			DB.Where(&DisallowedArea{Global: true}).Find(&v)
			w.WriteJson(&v)
		}),
		rest.Post("/disallowed_zones", func(w rest.ResponseWriter, r *rest.Request) {
			user := getAuthedUser(r)
			if user == nil {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				return
			}
			v := DisallowedArea{}
			if err := r.DecodeJsonPayload(&v); err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			v.OwnerUserID = user.ID
			if err := DB.Save(&v).Error; err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			w.WriteJson(&v)
			sendCreatedDisallowedAreas(user, []DisallowedArea{v})
		}),
		rest.Post("/global_disallowed_zones",
			PermissionDecorator([]string{"zone_editor"},
				func(w rest.ResponseWriter, r *rest.Request) {
					user := getAuthedUser(r)
					if user == nil {
						rest.Error(w, "Unauthorised", http.StatusUnauthorized)
						return
					}
					v := DisallowedArea{}
					if err := r.DecodeJsonPayload(&v); err != nil {
						rest.Error(w, err.Error(), http.StatusBadRequest)
						return
					}
					v.Global = true
					v.OwnerUserID = user.ID
					if err := DB.Save(&v).Error; err != nil {
						rest.Error(w, err.Error(), http.StatusBadRequest)
						return
					}

					w.WriteJson(&v)

					wsTransportServer.ForwardMsg(
						getZonesMsg("add_global_nofly_zones", []DisallowedArea{v}, wsTransportServer))
				})),
		rest.Delete("/disallowed_zones/:id", func(w rest.ResponseWriter, r *rest.Request) {
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
			deletedZones := []DisallowedArea{}
			DB.Where(&DisallowedArea{Common: common.Common{ID: id}, OwnerUserID: user.ID}).Find(&deletedZones)

			if err := DB.Where(&DisallowedArea{Common: common.Common{ID: id}, OwnerUserID: user.ID}).Delete(DisallowedArea{}).Error; err != nil {
				rest.Error(w, "Not found", http.StatusNotFound)
				return
			}
			sendDeletedDisallowedAreas(user, deletedZones)
		}),
		rest.Delete("/global_disallowed_zones/:id",
			PermissionDecorator([]string{"zone_editor"},
				func(w rest.ResponseWriter, r *rest.Request) {
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
					deletedZones := []DisallowedArea{}
					DB.Where(&DisallowedArea{Common: common.Common{ID: id}, Global: true}).Find(&deletedZones)

					if err := DB.Where(&DisallowedArea{Common: common.Common{ID: id}, Global: true}).Delete(DisallowedArea{}).Error; err != nil {
						rest.Error(w, "Not found", http.StatusNotFound)
						return
					} else {
						wsTransportServer.ForwardMsg(
							getZonesMsg("delete_global_nofly_zones", deletedZones, wsTransportServer))
					}

				})),
	}
}

func (i DisallowedArea) InitDB(DB *gorm.DB) {
	DB.AutoMigrate(&DisallowedArea{})

}

func (i DisallowedArea) Init() {
}

func getZonesMsg(cmdType string, zones []DisallowedArea, src ws_transport.Entity) *ws_transport.Msg {

	return createWsMsg(cmdType, struct {
		Zones []DisallowedArea `json:"zones"`
	}{zones},
		src)
}

func sendDeletedDisallowedAreas(owner *User, zones []DisallowedArea) {
	msg := getZonesMsg("delete_nofly_zones", zones, owner)
	wsTransportServer.ForwardMsgTo(msg, owner)
	wsTransportServer.ForwardMsg(msg)
}

func sendCreatedDisallowedAreas(owner *User, zones []DisallowedArea) {
	msg := getZonesMsg("add_nofly_zones", zones, owner)
	wsTransportServer.ForwardMsgTo(msg, owner)
	wsTransportServer.ForwardMsg(msg)
}

func getUserNoFlyZones(owner *User) *ws_transport.Msg {

	zones := []DisallowedArea{}
	DB.Where("owner_user_id = ?", owner.ID).Find(&zones)

	return getZonesMsg("update_nofly_zones", zones, owner)
}

func getGlobalNoFlyZones() *ws_transport.Msg {
	zones := []DisallowedArea{}
	DB.Where("global = true").Find(&zones)

	return getZonesMsg("update_global_nofly_zones", zones, wsTransportServer)
}
