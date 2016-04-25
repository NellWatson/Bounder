// listen_port=8080
// db_ip=localhost
// db_port=13306
// db_login=
// db_pass=
// db_name=

package config

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"

	"os"
)

type DBSettings struct {
	Ip    string
	Port  int16
	Login string
	Pass  string
	Name  string
}

type ServerSettings struct {
	Port_to_listen          int16
	LogPath                 string
	MainServerPollingDelay  int
	RequireAuthForPostUsers bool
	ServeStatic             bool
	JWTKey                  []byte
	JWTSigningMethod        string
}

var DB DBSettings
var Server ServerSettings

var logFile *os.File

func ReadConfig(folderPath string) {
	fmt.Printf("%v\n", folderPath)
	jsonBlob, err := ioutil.ReadFile(folderPath + "/settings.json")
	if err != nil {
		log.Fatal(err)
	}
	// fmt.Println(string(jsonBlob))

	if err := json.Unmarshal(jsonBlob, &DB); err != nil {
		fmt.Println("error:", err)
	}
	fmt.Printf("%+v\n", DB)

	Server.JWTKey = []byte("zI5EYLr8ABMz1zsIkDOVbL7WBdQCcCB/OJIf+ucw5vs=")
	Server.JWTSigningMethod = "HS256"
	if err := json.Unmarshal(jsonBlob, &Server); err != nil {
		fmt.Println("error:", err)
	}
	fmt.Printf("%+v\n", Server)

	logFile, err := os.OpenFile(Server.LogPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0666)
	if err != nil {
		fmt.Printf("error opening file: %v", err)
	}

	log.SetOutput(logFile)
	log.SetFlags(log.Llongfile | log.Ldate | log.Ltime)
	log.Println("Log initialized")
}
