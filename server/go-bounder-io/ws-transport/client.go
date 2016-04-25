package ws_transport

import (
	"fmt"
	"golang.org/x/net/websocket"
	// "io"
	"log"
	"sync"
	"time"
)

const channelBufSize = 5

var maxId int64 = 0

// Chat client.
type Client struct {
	id              int64
	ws              *websocket.Conn
	server          *Server
	ch              chan *Msg
	doneCh          chan bool
	entity          Entity
	entityUpdChan   chan EntityUpdate
	entitySyncMutex sync.Mutex
	exitCh          chan bool
}

func (c *Client) NewMsg() Msg {
	ret := Msg{}
	ret.SrcEntity = c.entity
	return ret
}

// Create new chat client.
func NewClient(ws *websocket.Conn, server *Server, entity Entity) *Client {

	if ws == nil {
		panic("ws cannot be nil")
	}

	if server == nil {
		panic("server cannot be nil")
	}

	maxId++
	ch := make(chan *Msg, channelBufSize)
	// ch := make(chan interface{})
	doneCh := make(chan bool)

	entityUpdChan := make(chan EntityUpdate, channelBufSize)
	return &Client{maxId, ws, server, ch, doneCh, entity, entityUpdChan, sync.Mutex{}, make(chan bool)}
}

func (c *Client) Conn() *websocket.Conn {
	return c.ws
}

func (c *Client) Write(msg *Msg) {
	select {
	case c.ch <- msg:
	default:
		c.server.Del(c)
		err := fmt.Errorf("client %d is disconnected.", c.id)
		c.server.Err(err)
	}
}

func (c *Client) Done() {
	c.doneCh <- true
}

func (c *Client) Exit() {
	c.exitCh <- true
}

func (c *Client) UpdateEntity(e EntityUpdate) {
	c.entityUpdChan <- e
}

// Listen Write and Read request via chanel
func (c *Client) Listen() {
	go c.listenWrite()
	c.listenRead()
}

// Listen write request via chanel
type container struct {
	Payload      interface{} `json:"payload"`
	SourceID     string      `json:"source_id"`
	SourceEntity interface{} `json:"source_entity"`
	ServerTime   time.Time   `json:"server_time"`
}

func (c *Client) PackAndSend(msg *Msg) {
	websocket.JSON.Send(c.ws, container{msg.Payload,
		msg.SrcEntity.Id(),
		msg.SrcEntity,
		time.Now()})
}

func (c *Client) listenWrite() {
	c.server.wg.Add(1)
	// log.Println("Listening write to client")
	defer func() {
		// log.Println(c.entity.Id(), " listenWrite exited")
		c.server.wg.Done()
	}()
	for {
		select {

		// send message to the client
		case msg := <-c.ch:
			// log.Println("Send:", payload)
			if c.entity.Enabled() {
				// log.Printf("Msg %v → %v(%v)", msg.SrcEntity.Id(), c.entity.Id(), c.id)
				c.PackAndSend(msg)
			}

		// receive done request
		case <-c.doneCh:
			c.ws.Close()
			c.server.Del(c)
			return
		case upd := <-c.entityUpdChan:
			c.entitySyncMutex.Lock()
			c.entity = upd.Update
			c.entitySyncMutex.Unlock()
			// log.Println("Updated entity for client %v with %v", c, c.entity)
			upd.Feedback <- true
			if c.entity.NonExists() {
				log.Printf("disconnecting entity %v", c.entity)
				// c.ws.Close()
				// c.server.Del(c)
				c.doneCh <- true // for listenRead method
				return
			}

		case <-c.exitCh:
			c.ws.Close()
			<-c.doneCh
			return
		}
	}
}

// Listen read request via chanel
func (c *Client) listenRead() {
	// log.Println("Listening read from client")
	c.server.wg.Add(1)
	defer func() {
		// log.Println(c.entity.Id(), " listenRead exited")
		c.server.wg.Done()
	}()
	for {
		select {

		// receive done request
		case <-c.doneCh:
			c.ws.Close()
			c.server.Del(c)
			// c.doneCh <- true // for listenWrite method
			return

		// read data from websocket connection
		default:
			msg := c.NewMsg()
			err := websocket.JSON.Receive(c.ws, &msg.Payload)
			if err != nil {
				c.doneCh <- true
				return

			} else {
				// log.Printf("%+v", msg)
				c.entitySyncMutex.Lock()
				ent := c.entity
				c.entitySyncMutex.Unlock()

				if ent.Enabled() {
					msg_frwd, to_self, stop := c.entity.HandleIncomingMsg(&msg)
					if stop == false {
						c.server.ForwardMsg(&msg)
					}
					if to_self != nil {
						c.Write(c.server.NewServerMsg(to_self.Payload))
					}
					if msg_frwd != nil {
						c.server.ForwardMsg(msg_frwd)

					}
				}
			}
		}
	}

}
