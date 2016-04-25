package main

import (
	"./config"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/jinzhu/gorm"
	"io"
	"log"
	"net/http"

	"bytes"
	cryptoRand "crypto/rand"
	"encoding/hex"
	// "encoding/json"
	"errors"
	"golang.org/x/crypto/scrypt"

	"./common"
	"./ws-transport"
	"fmt"
	jwt_go "github.com/dgrijalva/jwt-go"
	"strconv"
	// "time"
)

type UserRole struct {
	ID    int64  `json:"id" gorm:"primary_key"`
	Name  string `json:"name" sql:"type:varchar(4096)"`
	Users []User `json:"users" gorm:"many2many:userrole_users;"`
}

func (i UserRole) GetRoutes() []*rest.Route {
	return []*rest.Route{
		rest.Get("/user_roles", func(w rest.ResponseWriter, r *rest.Request) {
			if !checkSuperUser(w, r) {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				return
			}

			userRoles := []UserRole{}
			DB.Find(&userRoles)

			for i, _ := range userRoles {
				users := []User{}
				DB.Model(&userRoles[i]).Association("Users").Find(&users)
				userRoles[i].Users = users
			}

			w.WriteJson(&userRoles)
			// log.Println("rest.Get(/applications", events[0].Users)
		}),
	}
}

func (i UserRole) InitDB(DB *gorm.DB) {
	DB.AutoMigrate(&UserRole{})

}

func (i UserRole) Init() {
}

type User struct {
	common.Common

	Login             string     `json:"login" sql:"not null;unique"`
	PasswordHash      string     `json:"-"`
	PasswordSalt      string     `json:"-"`
	PlaintextPassword string     `sql:"-" json:"plaintextPassword"`
	UserRoles         []UserRole `json:"roles" gorm:"many2many:userrole_users;"`
	Active            bool       `json:"-"`
	// Email             string     `json:"email"`
}

func (i User) GetRoutes() []*rest.Route {
	return []*rest.Route{
		rest.Post("/users", func(w rest.ResponseWriter, r *rest.Request) {

			log.Println("creating user")
			if config.Server.RequireAuthForPostUsers {
				if !checkSuperUser(w, r) {
					rest.Error(w, "Unauthorised", http.StatusUnauthorized)
					return
				}
			}

			user := User{}
			if err := r.DecodeJsonPayload(&user); err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				log.Println(err.Error())
				return
			}
			if user.Login == "" || user.PlaintextPassword == "" {
				rest.Error(w, "Login, password and roles cannot be empty", http.StatusBadRequest)
				log.Println("Login, password and roles cannot be empty")
				return
			}

			rlist := []UserRole{}
			t := []string{}
			for _, rl := range user.UserRoles {
				if rl.Name != "superadmin" {
					t = append(t, rl.Name)
				}
			}
			DB.Where("name in (?)", t).Find(&rlist)
			// if len(rlist) == 0 {
			// 	rest.Error(w, "No such roles", http.StatusBadRequest)
			// 	return
			// }
			user.UserRoles = rlist

			salt := make([]byte, PW_SALT_BYTES)
			_, err := io.ReadFull(cryptoRand.Reader, salt)
			if err != nil {
				log.Fatal(err)
				return
			}

			hash, err := scrypt.Key([]byte(user.PlaintextPassword), salt, 1<<17, 8, 1, PW_HASH_BYTES)
			if err != nil {
				log.Fatal(err)
				return
			}
			user.PlaintextPassword = ""
			user.PasswordHash = hex.EncodeToString(hash)
			user.PasswordSalt = hex.EncodeToString(salt)
			user.Active = true //TODO email confirmation
			if err := DB.Save(&user).Error; err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			if err := DB.Model(&user).Association("UserRoles").Replace(rlist).Error; err != nil {
				rest.Error(w, err.Error(), http.StatusInternalServerError)
				log.Println("err", err)
				return
			}

			w.WriteJson(&user)
		}),
		rest.Delete("/users/:id", func(w rest.ResponseWriter, r *rest.Request) {
			if !checkSuperUser(w, r) {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				return
			}
			id, err := strconv.ParseInt(r.PathParam("id"), 10, 64)
			if err != nil {
				rest.Error(w, "Bad request", http.StatusBadRequest)
				return
			}
			user := User{Common: common.Common{ID: id}}
			if err := DB.Delete(&user).Error; err != nil {
				rest.Error(w, "Not found", http.StatusNotFound)
				return
			}
		}),
		rest.Put("/users/:id", func(w rest.ResponseWriter, r *rest.Request) {
			if !checkSuperUser(w, r) {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				return
			}

			user := User{}
			if DB.Where(&User{Login: r.PathParam("id")}).First(&user).RecordNotFound() {
				rest.Error(w, "StatusNotFound", http.StatusNotFound)
				log.Println("not found")

				return
			}

			type Resp struct {
				Roles []string `json:"roles"`
			}
			var resp Resp

			if err := r.DecodeJsonPayload(&resp); err != nil {
				rest.Error(w, err.Error(), http.StatusBadRequest)
				log.Println(err.Error())
				return
			}

			roles := []UserRole{}
			DB.Where("name in (?)", resp.Roles).Find(&roles)
			// log.Println(roles)
			if err := DB.Model(&user).Association("UserRoles").Replace(roles).Error; err != nil {
				rest.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			user.UserRoles = roles

			w.WriteJson(&user)
		}),

		rest.Get("/users/:id", func(w rest.ResponseWriter, r *rest.Request) {
			if !checkSuperUser(w, r) {
				rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				return
			}

			id, err := strconv.ParseInt(r.PathParam("id"), 10, 64)
			if err != nil {
				rest.Error(w, "Bad request", http.StatusBadRequest)
				log.Println(err.Error())
				return
			}

			user := User{}
			if DB.Where(&User{Common: common.Common{ID: id}}).First(&user).RecordNotFound() {
				rest.Error(w, "StatusNotFound", http.StatusNotFound)
				return
			}

			roles := []UserRole{}
			DB.Model(&user).Association("UserRoles").Find(&roles)
			user.UserRoles = roles

			w.WriteJson(&user)
		}),
		rest.Get("/users", func(w rest.ResponseWriter, r *rest.Request) {
			// log.Println(r.Header.Get("Authorization"))
			if !checkSuperUser(w, r) {
				user := getAuthedUser(r)
				if user == nil {
					rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				} else {
					if DB.Where(&User{Common: common.Common{ID: user.ID}}).First(&user).RecordNotFound() {
						rest.Error(w, "StatusNotFound", http.StatusNotFound)
						return
					} else {
						w.WriteJson(&user)
					}
				}
			} else {
				log.Println("SU")
				// users := []User{}

				// DB.Find(&users)

				// w.WriteJson(&users)
				user := getAuthedUser(r)
				if user == nil {
					rest.Error(w, "Unauthorised", http.StatusUnauthorized)
				} else {
					if DB.Where(&User{Common: common.Common{ID: user.ID}}).First(&user).RecordNotFound() {
						rest.Error(w, "StatusNotFound", http.StatusNotFound)
						return
					} else {
						w.WriteJson(&user)
					}
				}
			}
		}),
	}
}
func (i User) Init() {
}

func (i User) Id() string {
	return fmt.Sprintf("user%v", i.ID)
}

func (i User) CreateFromRequest(r *http.Request) (ws_transport.Entity, error) {
	token := r.FormValue("token")

	if token != "" {

		t, err := jwt_go.Parse(token, func(token *jwt_go.Token) (interface{}, error) {
			if jwt_go.GetSigningMethod(config.Server.JWTSigningMethod) != token.Method {
				return nil, errors.New("Invalid signing algorithm")
			}
			return config.Server.JWTKey, nil
		})
		if err != nil {
			return nil, errors.New("Token parsing failed")
		}
		user := User{}
		if DB.Where(&User{Login: t.Claims["id"].(string)}).First(&user).Error == nil {
			return user, nil
		}
	}
	return nil, errors.New("Not found")
}

func (i User) HandleIncomingMsg(msg *ws_transport.Msg) (toForward *ws_transport.Msg, toSelf *ws_transport.Msg, stopPropagation bool) {

	type t struct {
		Type          string `json:"cmd_type"`
		ServerMessage string `json:"server_message"`
	}
	stopPropagation = false
	toForward = nil
	toSelf = nil
	if err := AddUserCommandFromMsg(msg); err != nil {
		stopPropagation = true

		toSelf = createWsMsg(
			"user_command_format_error",
			struct {
				ServerMessage string `json:"server_message"`
			}{err.Error()},
			i)

	}
	return
}

func (i User) Type() int {
	return ws_transport.EntityNormal
}

func (i User) Tag() string {
	return "user"
}

func (i User) Enabled() bool {
	return true
}

var userEntityUpdateChannel chan ws_transport.EntityUpdate = make(chan ws_transport.EntityUpdate)

func (i User) UpdateChan() chan ws_transport.EntityUpdate {
	return userEntityUpdateChannel
}

func (i User) NonExists() bool {
	return i.Common.DeletedAt.Year() > 1
}

func (i User) UpdateOnlineStatus(status bool) (*ws_transport.Msg, []*ws_transport.Msg) {
	// log.Printf("user %v online status: %v", i.Id(), status)
	return nil, nil
}

func (i User) InitDB(DB *gorm.DB) {
	DB.AutoMigrate(&User{})
}

const (
	PW_SALT_BYTES = 32
	PW_HASH_BYTES = 64
)

func authFunc(userId string, password string) bool {
	user := User{}
	if DB.Where(&User{Login: userId}).First(&user).Error == nil {
		salt, _ := hex.DecodeString(user.PasswordSalt)
		trueHash, _ := hex.DecodeString(user.PasswordHash)
		hash, err := scrypt.Key([]byte(password), salt, 1<<17, 8, 1, PW_HASH_BYTES)
		if err == nil {
			if bytes.Equal(hash, trueHash) && user.Active {
				return true
			}
		}
	}
	return false
}

func authenticate(userId string, request *rest.Request) bool {
	user := User{}
	if DB.Where(&User{Login: userId}).First(&user).Error == nil {
		roles := []UserRole{}
		DB.Model(&user).Association("UserRoles").Find(&roles)
		user.UserRoles = roles
		request.Env["USER_STRUCT"] = user

		return true
	}
	request.Env["USER_STRUCT"] = nil
	return false
}

func (user User) checkRights(rights []string) bool {
	rlist := []UserRole{}
	DB.Where("name in (?)", rights).Find(&rlist)
	if len(rlist) == 0 {
		return false
	}
	for _, r := range rlist {
		f := false
		for _, ur := range user.UserRoles {
			if r.ID == ur.ID {
				f = true
				break
			}
		}
		if f == false {
			return false
		}
	}
	return true
}

func checkSuperUser(w rest.ResponseWriter, r *rest.Request) bool {
	if r.Env["USER_STRUCT"] == nil {

		return false
	}
	if !r.Env["USER_STRUCT"].(User).checkRights([]string{"superadmin"}) {

		return false
	}
	return true
}

func getAuthedUser(r *rest.Request) *User {
	user := User{}
	if r.Env["USER_STRUCT"] != nil {
		user = r.Env["USER_STRUCT"].(User)
		return &user
	} else {
		return nil
	}

}

func SU_ONLY(f func(rest.ResponseWriter, *rest.Request)) func(rest.ResponseWriter, *rest.Request) {
	return PermissionDecorator([]string{"superadmin"}, f)
}

func PermissionDecorator(rights []string, f func(rest.ResponseWriter, *rest.Request)) func(rest.ResponseWriter, *rest.Request) {
	return func(w rest.ResponseWriter, r *rest.Request) {
		usr := r.Env["USER_STRUCT"].(User)
		if usr.checkRights(rights) {
			f(w, r)
		} else {
			rest.Error(w, "Unauthorised", http.StatusUnauthorized)
		}
	}
}
