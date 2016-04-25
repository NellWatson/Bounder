package ws_transport

import (
	"fmt"
	"golang.org/x/net/websocket"
	"log"
	"net/http"
	"reflect"
	"sync"
)

type Msg struct {
	Payload   interface{}
	SrcEntity Entity
}

type MsgTo struct {
	m   Msg
	Dst Entity
}

func (s *Server) NewServerMsg(payload interface{}) *Msg {
	return &Msg{Payload: payload, SrcEntity: s}
}

// Chat server.
type Server struct {
	pattern string
	// messages  []*Message
	clients           map[int64]*Client
	entityId2Id_Table map[string]map[int64]bool

	addCh        chan *Client
	delCh        chan *Client
	routeMsgCh   chan *Msg
	routeMsgToCh chan *MsgTo
	doneCh       chan bool
	errCh        chan error

	Entities          []Entity
	routes            map[string][]string
	routesCh          chan map[string][]string
	entityUpdatesChan chan EntityUpdate
	wg                sync.WaitGroup
}

const ( // iota is reset to 0
	EntityServer       = iota //For broadcasting
	EntityUnauthorised = iota //For rejecting messages
	EntityNormal       = iota //Normal
)

type EntityUpdate struct {
	Update   Entity
	Feedback chan bool
}

type Entity interface {
	//unique entity id to address it during Transport work
	Id() string
	//See↑
	Type() int
	//Construct new entity from incoming request
	CreateFromRequest(*http.Request) (Entity, error)
	//Called, when Entity of this type sends something.
	//Return values are message to forward accroding to current routes and "echo" message for source entity
	HandleIncomingMsg(*Msg) (toForward *Msg, toSelf *Msg, stopPropagation bool)
	//Called when Entity goes online or offline
	//Return values are message to forward accroding to current routes and "echo" message for source entity
	UpdateOnlineStatus(status bool) (toForward *Msg, toSelf []*Msg)
	//If false, all messages from entity are rejected
	Enabled() bool
	//channel for WsTransport to receive changes in this Entity
	UpdateChan() chan EntityUpdate
	//Deleted entities are immediatly removed from the transport
	NonExists() bool
}

func address(e Entity) string {
	return reflect.TypeOf(e).String() + e.Id()
}

// Create new chat server.
func NewServer(pattern string, entities []Entity) *Server {
	// messages := []*Message{}
	clients := make(map[int64]*Client)
	// authorizedClients := make(map[int64]*Client)
	entityId2Id_Table := make(map[string]map[int64]bool)
	addCh := make(chan *Client)
	delCh := make(chan *Client)
	routeMsgCh := make(chan *Msg)
	routeMsgToCh := make(chan *MsgTo)
	doneCh := make(chan bool)
	errCh := make(chan error)
	routes := make(map[string][]string)

	routesCh := make(chan map[string][]string)
	entityUpdatesChan := make(chan EntityUpdate)
	return &Server{
		pattern,
		clients,
		entityId2Id_Table,

		addCh,
		delCh,
		routeMsgCh,
		routeMsgToCh,
		doneCh,
		errCh,
		entities,
		routes,
		routesCh,
		entityUpdatesChan,
		sync.WaitGroup{},
	}
}

func (s *Server) Add(c *Client) {
	s.addCh <- c
}

func (s *Server) Del(c *Client) {
	s.delCh <- c
}

func (s *Server) ForwardMsg(msg *Msg) {
	s.routeMsgCh <- msg
}

func (s *Server) ForwardMsgTo(msg *Msg, target Entity) {
	s.routeMsgToCh <- &MsgTo{m: *msg, Dst: target}
}

func (s *Server) forwardMsgTo(msg *Msg, target Entity) error {
	if peerEntityList, ok := s.entityId2Id_Table[target.Id()]; ok {
		if len(peerEntityList) == 0 {
			return fmt.Errorf("Entity %s is not online", target.Id())
		}
		for wsId, _ := range peerEntityList {
			s.clients[wsId].Write(msg)
		}
		return nil
	} else {
		return fmt.Errorf("Entity %s is not online", target.Id())
	}

}

func (s *Server) Done() {
	s.doneCh <- true
	s.wg.Wait()
}

func (s *Server) Err(err error) {
	s.errCh <- err
}

func (s *Server) forwardMsg(msg *Msg) {
	switch msg.SrcEntity.Type() {
	case EntityUnauthorised:
		return
	case EntityServer:
		for _, client := range s.clients {
			client.Write(msg)
		}
	case EntityNormal:
		if r, ok := s.routes[msg.SrcEntity.Id()]; ok {

			for _, cId := range r {
				addr_not_online := false
				if peerEntityList, ok := s.entityId2Id_Table[cId]; ok {
					for wsId, _ := range peerEntityList {
						s.clients[wsId].Write(msg)
						// log.Println("msg for ", wsId, msg)
					}
					if len(peerEntityList) == 0 {
						addr_not_online = true
					}
				} else {
					addr_not_online = true
				}
				if addr_not_online {
					//REMOVE
					// type Resp struct {
					// 	Error   string `json:"error"`
					// 	CmdType string `json:"cmd_type"`
					// }
					// s.forwardMsgTo(&Msg{
					// 	Payload:   Resp{CmdType: "transport_error", Error: "DST entity is not online"},
					// 	SrcEntity: s,
					// }, msg.SrcEntity)

				}
			}
		} else {
			log.Printf("No routes for entity %v", msg.SrcEntity.Id())
		}
	}

}

func (s *Server) UpdateRoutes(entitiesRoutes map[string][]string) {
	s.routesCh <- entitiesRoutes
}

// Listen and serve.
// It serves client connection and broadcast request.
func (s *Server) Listen() {
	log.Println("Ws Transport Listen entered")
	defer func() {
		log.Println("Ws Transport Listen  exited")
	}()

	for _, e := range s.Entities {
		log.Printf("registering update channel for entity %v", reflect.TypeOf(e).Name())

		go func(c <-chan EntityUpdate) {
			for upd := range c {

				s.entityUpdatesChan <- upd
			}
		}(e.UpdateChan())
	}
	log.Println("Listening ws server...")

	// websocket handler
	onConnected := func(ws *websocket.Conn) {
		// log.Println("websocket handler entered")
		defer func() {
			// log.Println("websocket handler exited")
		}()
		defer func() {
			ws.Close()
			// err := ws.Close()
			// if err != nil {
			// 	s.errCh <- err
			// }
		}()
		var entity Entity
		entity = nil

		for _, e := range s.Entities {
			if ent, err := e.CreateFromRequest(ws.Request()); err == nil {
				entity = ent
				break
			}
		}
		if entity != nil {
			var client *Client

			client = NewClient(ws, s, entity)
			log.Printf(">>> %v", client.entity.Id())

			s.Add(client)
			msg, to_self := client.entity.UpdateOnlineStatus(true)

			if msg != nil {

				s.ForwardMsg(msg)
			}
			if to_self != nil {
				// client.ch <= o
				for _, m := range to_self {
					client.PackAndSend(s.NewServerMsg(m.Payload))
				}
				// client.Write(to_self)
			}
			client.Listen()

		} else {
			ws.Close()
		}
	}
	http.Handle(s.pattern, websocket.Handler(onConnected))
	// log.Println("Created handler")

	for {
		select {

		// Add new a client
		case c := <-s.addCh:
			if c.entity.Type() == EntityNormal {
				if _, ok := s.entityId2Id_Table[c.entity.Id()]; !ok {
					s.entityId2Id_Table[c.entity.Id()] = make(map[int64]bool)
				}
				s.entityId2Id_Table[c.entity.Id()][c.id] = true
			}
			s.clients[c.id] = c
			// log.Println("Now", len(s.clients), "clients connected.")
			// s.sendPastMessages(c)

		// del a client
		case c := <-s.delCh:
			// c.entity.UpdateOnlineStatus(false)
			msg, _ := c.entity.UpdateOnlineStatus(false)

			if msg != nil {
				s.forwardMsg(msg)
			}
			// log.Println("Delete client")
			log.Printf("<<< %v", c.entity.Id())
			delete(s.clients, c.id)
			if _, ok := s.entityId2Id_Table[c.entity.Id()]; ok {
				if _, ok := s.entityId2Id_Table[c.entity.Id()][c.id]; ok {
					delete(s.entityId2Id_Table[c.entity.Id()], c.id)
				}
			}

		case msg := <-s.routeMsgCh:

			s.forwardMsg(msg)
		case msgTo := <-s.routeMsgToCh:
			s.forwardMsgTo(&msgTo.m, msgTo.Dst)
		case err := <-s.errCh:
			log.Println("Error:", err.Error())

		case <-s.doneCh:
			s.forwardMsg(&Msg{SrcEntity: s, Payload: map[string]interface{}{"cmd_type": "server_goodbye"}})
			for _, client := range s.clients {
				client.Exit()
			}

			return
		case routes := <-s.routesCh:
			for entId, rs := range routes {
				s.routes[entId] = rs
				log.Printf("New dst list for entity %v: %+v\n ", entId, rs)
			}
			if len(routes) == 0 {
				s.routes = make(map[string][]string)
			}
		case newEntityUpdate := <-s.entityUpdatesChan:
			// log.Printf("Entity update: %+v", newEntity.Id())
			// log.Printf("s.entityId2Id_Table: %+v", s.entityId2Id_Table)
			if ids, ok := s.entityId2Id_Table[newEntityUpdate.Update.Id()]; ok {
				for c_index, _ := range ids {
					s.clients[c_index].UpdateEntity(newEntityUpdate)
					// log.Printf("Updating entity %v for conn %v\n", newEntity, c_index)
				}

			}
		}
	}
	log.Println("Exited")
}

func (s *Server) Id() string                                      { return "server" }
func (s *Server) Type() int                                       { return EntityServer }
func (s *Server) CreateFromRequest(*http.Request) (Entity, error) { return nil, nil }
func (s *Server) HandleIncomingMsg(*Msg) (*Msg, *Msg, bool)       { return nil, nil, false }
func (s *Server) UpdateOnlineStatus(status bool) (*Msg, []*Msg)   { return nil, nil }
func (s *Server) Enabled() bool                                   { return true }
func (s *Server) UpdateChan() chan EntityUpdate                   { return nil }
func (s *Server) NonExists() bool                                 { return false }
