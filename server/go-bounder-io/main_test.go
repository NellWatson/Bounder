package main

import (
	"./config"
	"encoding/json"
	. "github.com/emicklei/forest"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"testing"
	"time"
)

var github = NewClient("http://localhost:8080", new(http.Client))
var apiTempl = "/api/{repo}"
var apiTemplWithID = "/api/{repo}/{id}"
var server net.Listener

func TestMain(m *testing.M) {
	setupFunction()
	retCode := m.Run()
	teardownFunction()
	os.Exit(retCode)
}

func setupFunction() {
	config.ReadConfig("/Users/Tucher/bounder-io/server/go-bounder-io")
	server = run(false)
	time.Sleep(100 * time.Millisecond)
}

func teardownFunction() {
	server.Close()
}

func getToken(t *testing.T, login string, password string) string {
	d, _ := json.Marshal(map[string]interface{}{"username": login, "password": password})
	cfg := NewConfig(apiTempl, "login").Header("Content-Type", "application/json").Body(string(d))

	r := github.POST(t, cfg)
	ExpectStatus(t, r, 200)

	type Resp struct {
		Token string `json:"token"`
	}
	var resp Resp

	ExpectJSONDocument(t, r, &resp)

	if resp.Token == "" {
		t.Errorf("got empty token")
	}
	return resp.Token
}

/////////////////////////////////////////////////////////////////////
func TestAdmin(t *testing.T) {
	cfg0 := NewConfig(apiTempl, "users").Header("Content-Type", "application/json").
		Body(`{"login":"admin", "plaintextPassword":"vnachalebuloslovo", "roles":[{"name":"superadmin"}]}`)
	github.POST(t, cfg0)
}

func TestAuth(t *testing.T) {
	token := getToken(t, "admin", "vnachalebuloslovo")
	if token == "" {
		t.Errorf("Token is empty. May be wrong auth data?")
	}
	log.Println(token)
}

func TestGetUser(t *testing.T) {

	token := getToken(t, "admin", "vnachalebuloslovo")

	cfg := NewConfig(apiTemplWithID, "users", 1).Header("Authorization", "Bearer "+token)
	r := github.GET(t, cfg)
	ExpectStatus(t, r, 200)

	var resp User
	ExpectJSONDocument(t, r, &resp)
}
func TestCreateAndDeleteUsers(t *testing.T) {

	token := getToken(t, "admin", "vnachalebuloslovo")

	var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

	b := make([]rune, 10)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}

	testUserLogin := string(b)
	log.Println(testUserLogin)
	cfg := NewConfig(apiTempl, "users").Header("Authorization", "Bearer "+token).Header("Content-Type", "application/json").
		Body(`{"login":"` + testUserLogin + `", "plaintextPassword":"password", "roles":[{"name":"stub"}]}`)
	r := github.POST(t, cfg)
	ExpectStatus(t, r, 200)

	cfg1 := NewConfig(apiTempl, "users").Header("Authorization", "Bearer "+token).Header("Content-Type", "application/json").
		Body(`{"login":"` + testUserLogin + `", "plaintextPassword":"password", "roles":[{"name":"stub"}]}`)
	r1 := github.POST(t, cfg1)
	ExpectStatus(t, r1, 400)

	var resp User
	ExpectJSONDocument(t, r, &resp)

	cfg2 := NewConfig(apiTemplWithID, "users", resp.ID).Header("Authorization", "Bearer "+token)
	r2 := github.DELETE(t, cfg2)
	ExpectStatus(t, r2, 200)

	cfg3 := NewConfig(apiTemplWithID, "users", resp.ID)
	r3 := github.DELETE(t, cfg3)
	ExpectStatus(t, r3, 401)

	cfg4 := NewConfig(apiTemplWithID, "users", "wrong_id").Header("Authorization", "Bearer "+token)
	r4 := github.DELETE(t, cfg4)
	ExpectStatus(t, r4, 400)

	cfg5 := NewConfig(apiTempl, "users").Header("Authorization", "Bearer "+token).Header("Authorization", "Bearer "+token).Header("Content-Type", "application/json").
		Body(`{"login":"test_user", "plaintextPassword":"password", "roles":[{"name":"stub"}]}`)
	github.POST(t, cfg5)

}

func TestGetRoles(t *testing.T) {
	token := getToken(t, "admin", "vnachalebuloslovo")
	cfg := NewConfig(apiTempl, "user_roles").Header("Authorization", "Bearer "+token)
	r := github.GET(t, cfg)
	ExpectStatus(t, r, 200)

	var resp []UserRole

	ExpectJSONDocument(t, r, &resp)
	if len(resp) != 3 {
		t.Errorf("%+v \nRoles number is incorrect: %v (should be 3)", resp, len(resp))
	}

}

func TestModifyUserRoles(t *testing.T) {
	token := getToken(t, "admin", "vnachalebuloslovo")
	cfg := NewConfig(apiTemplWithID, "users", "test_user").Header("Authorization", "Bearer "+token).Header("Content-Type", "application/json").Body(`{"roles":["worker", "stub"]}`)

	r := github.PUT(t, cfg)
	ExpectStatus(t, r, 200)

	var resp User

	ExpectJSONDocument(t, r, &resp)
	t.Log(resp)
	if len(resp.UserRoles) != 2 {
		t.Errorf("%+v \nRoles number is incorrect: %v (should be 2)", resp, len(resp.UserRoles))
	}

}
