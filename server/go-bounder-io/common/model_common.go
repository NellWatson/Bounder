package common

import (
	"../config"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/jinzhu/gorm"
	"math/rand"
	"time"
)

type Common struct {
	ID        int64     `json:"id" gorm:"primary_key"`
	CreatedAt time.Time `json:"-"`
	UpdatedAt time.Time `json:"-"`
	DeletedAt time.Time `json:"-"`
}

type DataModel interface {
	GetRoutes() []*rest.Route
	InitDB(DB *gorm.DB)
	Init()
}

func (i Common) pollDelay() {
	time.Sleep(time.Millisecond * time.Duration(
		config.Server.MainServerPollingDelay*8/10+rand.Intn(config.Server.MainServerPollingDelay*4/10)))
}
