package main

import (
	"./common"
	"errors"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/jinzhu/gorm"
	// "net/http"
	"./ws-transport"
	"log"
)

type Route struct {
	common.Common
	SrcEntityID string `json:"src_entity_id" gorm:"index" sql:"not null" sql:"index"`
	DstEntityID string `json:"dst_entity_id" gorm:"index" sql:"not null" sql:"index"`
}

func (i Route) GetRoutes() []*rest.Route {
	return []*rest.Route{}
}

func (i Route) InitDB(DB *gorm.DB) {
	DB.AutoMigrate(&Route{})

}

func (i Route) Init() {
	readRoutes()
}

func createBidirLink(e1 ws_transport.Entity, e2 ws_transport.Entity) error {
	r1, r2 := Route{SrcEntityID: e1.Id(), DstEntityID: e2.Id()},
		Route{SrcEntityID: e2.Id(), DstEntityID: e1.Id()}
	if err1, err2 := DB.Save(&r1).Error, DB.Save(&r2).Error; err1 != nil || err2 != nil {
		log.Printf("cannot save routes: %v, %v", err1, err2)
		return errors.New("Cannot save routes")
	}

	dst1List, dst2List := []Route{}, []Route{}
	DB.Where(&Route{SrcEntityID: e1.Id()}).Find(&dst1List)
	DB.Where(&Route{SrcEntityID: e2.Id()}).Find(&dst2List)

	updatedRoutes := make(map[string][]string)
	id1, id2 := e1.Id(), e2.Id()
	for _, t := range dst1List {
		updatedRoutes[id1] = append(updatedRoutes[id1], t.DstEntityID)
	}
	for _, t := range dst2List {
		updatedRoutes[id2] = append(updatedRoutes[id2], t.DstEntityID)
	}
	wsTransportServer.UpdateRoutes(updatedRoutes)
	return nil
}

func removeEntity(e ws_transport.Entity) error {
	DB.Where(&Route{SrcEntityID: e.Id()}).Delete(Route{})
	DB.Where(&Route{DstEntityID: e.Id()}).Delete(Route{})
	readRoutes()
	return nil
}

func readRoutes() {
	routes := []Route{}
	DB.Find(&routes)

	updatedRoutes := make(map[string][]string)
	for _, t := range routes {
		updatedRoutes[t.SrcEntityID] = append(updatedRoutes[t.SrcEntityID], t.DstEntityID)
	}
	wsTransportServer.UpdateRoutes(updatedRoutes)
}
