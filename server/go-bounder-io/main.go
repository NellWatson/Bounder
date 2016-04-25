package main

import (
	"log"
	"net"
	"net/http"

	// "./chat"
	"./config"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/kardianos/osext"

	"./common"
	"./ws-transport"
	"fmt"
	"github.com/StephanDollberg/go-json-rest-middleware-jwt"
	"github.com/jinzhu/gorm"
	_ "github.com/lib/pq"
	"os"
	"os/signal"
	"reflect"
	// "runtime/pprof"
	"syscall"
	"time"
)

var models []common.DataModel = []common.DataModel{
	UserRole{},
	User{},
	Vehicle{},
	Route{},
	TelemetryRecord{},
	DisallowedArea{},
	UserCommand{},
	VehiclePath{},
}

var DB gorm.DB

var wsTransportServer *ws_transport.Server

var jwt_middleware = &jwt.JWTMiddleware{
	Key:              []byte("zI5EYLr8ABMz1zsIkDOVbL7WBdQCcCB/OJIf+ucw5vs="), //config.Server.JWTKey,
	Realm:            "jwt auth",
	Timeout:          time.Hour * 24,
	MaxRefresh:       time.Hour * 24,
	Authenticator:    authFunc, //TODO refactor
	Authorizator:     authenticate,
	SigningAlgorithm: "HS256", //config.Server.JWTSigningMethod,
}

func InitDB() {
	DSN := fmt.Sprintf("user=%v dbname=%v sslmode=disable password=%v",
		config.DB.Login,
		config.DB.Name,
		config.DB.Pass)
	var err error
	DB, err = gorm.Open("postgres", DSN)
	if err != nil {
		log.Fatalf("Got error when connect database, the error is '%v'", err)
	}
	// DB.LogMode(true)
}

func InitSchema() {
	for _, model := range models {
		model.InitDB(&DB)
		model.Init()
		log.Printf("%s: initialized", reflect.TypeOf(model).Name())
	}
}

func run(sync bool) net.Listener {

	jwt_middleware.Key = config.Server.JWTKey
	jwt_middleware.SigningAlgorithm = config.Server.JWTSigningMethod

	startWSTransport("/ws")

	InitDB()
	InitSchema()

	api := rest.NewApi()
	// statusMw := &rest.StatusMiddleware{}
	// api.Use(statusMw)

	api.Use(rest.DefaultDevStack...)

	api.Use(&rest.IfMiddleware{
		Condition: func(request *rest.Request) bool {
			return !(request.URL.Path == "/login" || request.URL.Path == "/ws" || (request.URL.Path == "/users" && request.Method == "POST"))
		},
		IfTrue: jwt_middleware,
	})

	routes := []*rest.Route{
		rest.Post("/login", jwt_middleware.LoginHandler),
		rest.Get("/refresh_token", jwt_middleware.RefreshHandler),
		// rest.Get("/.status", func(w rest.ResponseWriter, r *rest.Request) { w.WriteJson(statusMw.GetStatus()) }),
	}

	for _, model := range models {
		routes = append(routes,
			model.GetRoutes()...,
		)
	}

	api_router, err := rest.MakeRouter(routes...)
	if err != nil {
		log.Fatal(err)
	}

	api.SetApp(api_router)

	http.Handle("/api/", http.StripPrefix("/api", api.MakeHandler()))
	if config.Server.ServeStatic {
		http.Handle("/", http.FileServer(http.Dir("../html")))
	}

	if ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%v", config.Server.Port_to_listen)); err == nil {
		if !sync {
			go http.Serve(ln, nil)
		} else {
			http.Serve(ln, nil)
			log.Println("Shutting down ws-transport")
			wsTransportServer.Done()
		}
		return ln

	} else {
		log.Fatal(err)
	}
	return nil
}

func startWSTransport(url string) {
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigs
		fmt.Println()
		fmt.Println(sig)
		go func() {
			time.Sleep(15 * time.Second)
			os.Exit(0)
		}()
		wsTransportServer.Done()
		os.Exit(0)
	}()

	wsTransportServer = ws_transport.NewServer(url, []ws_transport.Entity{User{}, &Vehicle{}})
	go wsTransportServer.Listen()
}

func main() {

	// go func() {
	// 	for {
	// 		time.Sleep(5 * time.Second)
	// 		fmt.Println("##################################################################################")
	// 		pprof.Lookup("goroutine").WriteTo(os.Stdout, 1)

	// 	}
	// }()
	folderPath, err := osext.ExecutableFolder()
	if err != nil {
		log.Fatal(err)
	} else {
		config.ReadConfig(folderPath)
		run(true)
	}
}
