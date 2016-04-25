package main

import (
	"./common"
	"./ws-transport"
	"encoding/json"
	"fmt"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/jinzhu/gorm"
	"log"
	"net/http"
	"strconv"
	// "time"
)

type TelemetryRecordContentV1 struct {
}

type TelemetryRecord struct {
	ID             int64 `json:"id" gorm:"primary_key"`
	Data           JSONB `sql:"type:jsonb;index" json:"data"`
	OwnerVehicleID int64 `json:"-" gorm:"index" sql:"index"`
}

func (i TelemetryRecord) GetRoutes() []*rest.Route {
	return []*rest.Route{
		rest.Get("/telemetry_records", func(w rest.ResponseWriter, r *rest.Request) {
			user := getAuthedUser(r)
			if user == nil {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
			} else {
				vehicle_id := r.URL.Query().Get("vehicle_id")
				if len(vehicle_id) > 0 {
					v_id, err := strconv.ParseInt(vehicle_id, 10, 64)
					if err != nil {
						rest.Error(w, err.Error(), http.StatusBadRequest)
						log.Println(err.Error())
						return
					}
					vehicle := Vehicle{}
					if err := DB.Where(&Vehicle{OwnerUserID: user.ID, Common: common.Common{ID: v_id}}).First(&vehicle).Error; err != nil {
						rest.Error(w, fmt.Sprintf("%s for id %v", err.Error(), v_id), http.StatusBadRequest)
						return
					}
					telemList := []TelemetryRecord{}
					query := DB.Where(&TelemetryRecord{OwnerVehicleID: vehicle.ID})

					if from := r.URL.Query().Get("from"); len(from) > 0 {
						query = query.Where("(data->>'timestamp')::timestamptz >= ?::timestamptz", from)
					}

					if to := r.URL.Query().Get("to"); len(to) > 0 {
						query = query.Where("(data->>'timestamp')::timestamptz <= ?::timestamptz", to)
					}
					query = query.Order("(data->>'timestamp')::timestamptz desc")

					if filter := r.URL.Query().Get("filter"); len(filter) > 0 {
						query = query.Where("(data -> ?) is not null", filter)
						// query = query.Select("id, json_build_object(?::text, data->?, 'timestamp', data->>'timestamp') as data", filter, filter)

					}
					query.Find(&telemList)
					// time.Sleep(3 * time.Second)
					w.WriteJson(&telemList)

				} else {

					rest.Error(w, "Vehicle id is incorrect", http.StatusBadRequest)
					return
				}
			}

		}),
	}
}

func (i TelemetryRecord) InitDB(DB *gorm.DB) {
	DB.AutoMigrate(&TelemetryRecord{})

}

func (i TelemetryRecord) Init() {
}

func AddTelemetryFromMsg(msg *ws_transport.Msg) error {
	telem := WSMsg{}

	if d, err := json.Marshal(msg.Payload); err == nil {
		if err := json.Unmarshal(d, &telem); err == nil {
			switch telem.CmdType {
			case "mavlink_state", "ardupilot_status":
				if data, ok := telem.Params.(map[string]interface{}); ok {
					DB.Save(&TelemetryRecord{Data: data, OwnerVehicleID: msg.SrcEntity.(*Vehicle).ID})
					// return fmt.Errorf("test error")
					return nil
				} else {
					return fmt.Errorf("Bad params format")
				}

			default:
				return fmt.Errorf("Unknown cmd_type")
			}
		} else {
			return err
		}
	} else {
		return err
	}

	return fmt.Errorf("NotImplemented")
	//vehicle *Vehicle, data JSONB
	// if data, ok := msg.Payload.(map[string]interface{}); ok {

	// } else {
	// 	log.Println("msg.Payload: ", reflect.TypeOf(msg.Payload))
	// }
	// DB.Save(&TelemetryRecord{Data: data, OwnerVehicleID: vehicle.ID})
}
