package main

import (
	// "encoding/json"
	"fmt"
	tm "github.com/buger/goterm"
	common "github.com/hybridgroup/gobot/platforms/mavlink/common"
	"github.com/tarm/goserial"
	"io"
	// "net"
	"time"
)

func read(r io.Reader, length int) ([]byte, error) {
	buf := []byte{}
	for length > 0 {
		tmp := make([]byte, length)
		i, err := r.Read(tmp[:])
		if err != nil {
			return nil, err
		} else {
			length -= i
			buf = append(buf, tmp...)
			if length != i {
				<-time.After(1 * time.Millisecond)
			} else {
				break
			}
		}
	}
	return buf, nil
}

func ReadMAVLinkPacketD(r io.Reader) (*common.MAVLinkPacket, error) {
	for {
		header, err := read(r, 1)

		if err != nil {
			return nil, err
		}
		if header[0] == 254 {

			length, err := read(r, 1)
			if err != nil {
				fmt.Println("1")
				return nil, err
			} else if length[0] > 250 {
				// fmt.Println("2")
				continue
			}

			m := &common.MAVLinkPacket{}
			data, err := read(r, int(length[0])+7)
			if err != nil {
				return nil, err
			}
			data = append([]byte{header[0], length[0]}, data...)
			m.Decode(data)
			return m, nil
		}
	}
}

func main() {

	// conn, err := net.Dial("udp", "127.0.0.1:14550")
	// udp_addr, err := net.ResolveUDPAddr("udp", "127.0.0.1:14550")
	// if err != nil {
	// 	fmt.Println(err.Error())
	// 	return
	// }

	/* Now listen at selected port */
	// conn, err := net.ListenUDP("udp", udp_addr)
	// if err != nil {
	// 	fmt.Println(err.Error())
	// 	return
	// }
	// defer conn.Close()

	// buf := make([]byte, 1024)

	// for {
	// 	// n, addr, err := conn.ReadFromUDP(buf)
	// 	bts, err := read(conn, 10)
	// 	// fmt.Println("Received ", string(buf[0:n]), " from ", addr)

	// 	if err != nil {
	// 		fmt.Println("Error: ", err)
	// 	} else {
	// 		fmt.Println(string(bts))
	// 	}
	// }
	conn, err := serial.OpenPort(&serial.Config{Name: "/dev/cu.usbmodem1", Baud: 57600})
	if err != nil {
		fmt.Println(err.Error())
		return
	}

	for {
		// packet, err := common.ReadMAVLinkPacket(conn)
		packet, err := ReadMAVLinkPacketD(conn)

		if err != nil {
			fmt.Println(err.Error())
			continue
		}

		message, err := packet.MAVLinkMessage()
		if err != nil {
			fmt.Println(err.Error())
			continue
		}
		tm.Clear()
		tm.MoveCursor(1, 1)
		tm.Println(message.Id())
		switch message.Id() {
		case 30:
			m := message.(*common.Attitude)
			tm.Println("Attitude")
			tm.Println("TIME_BOOT_MS", m.TIME_BOOT_MS)
			tm.Println("ROLL", m.ROLL)
			tm.Println("PITCH", m.PITCH)
			tm.Println("YAW", m.YAW)
			tm.Println("ROLLSPEED", m.ROLLSPEED)
			tm.Println("PITCHSPEED", m.PITCHSPEED)
			tm.Println("YAWSPEED", m.YAWSPEED)
			tm.Println("")
			tm.Flush()
		case 0:
			// m := message.(*common.Heartbeat)
			// if d, err := json.Marshal(m); err == nil {
			// 	tm.Printf("%v, %v(%+v)\n", time.Now(), m.AUTOPILOT, string(d))
			// }
			// tm.Flush()

			// conn.Write(common.CraftMAVLinkPacket(packet.SystemID,
			// 	packet.ComponentID,
			// 	common.NewHeartbeat(
			// 		0,
			// 		common.MAV_TYPE_GCS,
			// 		common.MAV_AUTOPILOT_GENERIC,
			// 		0,
			// 		common.MAV_STATE_ACTIVE,
			// 		m.MAVLINK_VERSION,
			// 	),
			// ).Pack())

			// conn.Write(common.CraftMAVLinkPacket(packet.SystemID,
			// 	packet.ComponentID,
			// 	common.NewRequestDataStream(
			// 		4,
			// 		packet.SystemID,
			// 		0, //ComponentID
			// 		common.MAV_DATA_STREAM_ALL,
			// 		// common.MAV_DATA_STREAM_RAW_CONTROLLER,
			// 		1, //on
			// 	),
			// ).Pack())

		default:
			// if d, err := json.Marshal(message); err == nil {
			// 	fmt.Printf("%v, (%+v)\n", time.Now(), string(d))
			// }
		}

		time.Sleep(1)
	}
}
