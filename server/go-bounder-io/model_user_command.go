package main

import (
	// "./common"
	"./ws-transport"
	"encoding/json"
	"fmt"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/jinzhu/gorm"
	// "log"
	"net/http"
	// "strconv"
	"time"
)

type UserCommand struct {
	ID                int64     `json:"id" gorm:"primary_key"`
	Params            JSONB     `sql:"type:jsonb;index" json:"params"`
	OwnerUserID       int64     `json:"-" gorm:"index" sql:"index"`
	TargetVehicleUUID string    `json:"target_vehicle" gorm:"index" sql:"index"`
	CmdType           string    `json:"cmd_type" gorm:"index" sql:"index"`
	Timestamp         time.Time `json:"timestamp"`
}

func (i UserCommand) GetRoutes() []*rest.Route {
	return []*rest.Route{
		rest.Get("/user_commands", func(w rest.ResponseWriter, r *rest.Request) {
			user := getAuthedUser(r)
			if user == nil {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
			} else {

				cmdList := []UserCommand{}
				query := DB.Where(&UserCommand{OwnerUserID: user.ID})

				if vehicle_uuid := r.URL.Query().Get("vehicle_uuid"); len(vehicle_uuid) > 0 {
					query = query.Where(&UserCommand{TargetVehicleUUID: vehicle_uuid})
				}

				if from := r.URL.Query().Get("from"); len(from) > 0 {
					query = query.Where("timestamp::timestamptz >= ?::timestamptz", from)
				}

				if to := r.URL.Query().Get("to"); len(to) > 0 {
					query = query.Where("timestamp::timestamptz <= ?::timestamptz", to)
				}
				query = query.Order("timestamp::timestamptz asc")

				query.Find(&cmdList)
				w.WriteJson(&cmdList)

			}
			//TODO: post commands
		}),
	}
}

func (i UserCommand) InitDB(DB *gorm.DB) {
	DB.AutoMigrate(&UserCommand{})

}

func (i UserCommand) Init() {
}

func AddUserCommandFromMsg(msg *ws_transport.Msg) error {
	command := WSMsg{}

	if d, err := json.Marshal(msg.Payload); err == nil {
		if err := json.Unmarshal(d, &command); err == nil {
			if command.CmdType == "" || true {
				if data, ok := command.Params.(map[string]interface{}); ok {
					u, ok := data["uuid"].(string)
					uuid := ""
					if ok {
						uuid = u
					}
					DB.Save(&UserCommand{
						Params:            data,
						OwnerUserID:       msg.SrcEntity.(User).ID,
						CmdType:           command.CmdType,
						TargetVehicleUUID: uuid,
						Timestamp:         time.Now(),
					})
					return nil
				} else {
					return fmt.Errorf("Bad params format")
				}
			} else {
				return fmt.Errorf("Unknown cmd_type")
			}
		} else {
			return err
		}
	} else {
		return err
	}
	return fmt.Errorf("NotImplemented")
}
