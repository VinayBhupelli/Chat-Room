package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var mu sync.Mutex

var rooms = make(map[string]map[string]*Client)

type Client struct {
	conn     *websocket.Conn
	username string
	roomID   string
}

func webSocketHandler(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("roomID")
	username := r.URL.Query().Get("username")

	if roomID == "" || username == "" {
		http.Error(w, "Missing roomID or username", http.StatusBadRequest)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	log.Printf("User '%s' attempting to join room '%s'\n", username, roomID)

	mu.Lock()
	if rooms[roomID] == nil {
		rooms[roomID] = make(map[string]*Client)
	}
	if _, exists := rooms[roomID][username]; exists {
		conn.WriteMessage(websocket.TextMessage, []byte("ERROR: Username already taken."))
		mu.Unlock()
		return
	}

	client := &Client{
		conn:     conn,
		username: username,
		roomID:   roomID,
	}
	rooms[roomID][username] = client
	mu.Unlock()

	welcomeMsg := "Welcome " + username + "! You are connected to room " + roomID + "."
	if err := conn.WriteMessage(websocket.TextMessage, []byte(welcomeMsg)); err != nil {
		log.Println("Error sending welcome message:", err)
		return
	}

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message from", username, ":", err)
			break
		}
		log.Printf("Received message from '%s' in room '%s': %s\n", username, roomID, message)

		mu.Lock()
		for _, otherClient := range rooms[roomID] {
			if otherClient.username != username {
				broadcastMsg := username + ": " + string(message)
				if err := otherClient.conn.WriteMessage(websocket.TextMessage, []byte(broadcastMsg)); err != nil {
					log.Println("Error broadcasting to", otherClient.username, ":", err)
				}
			}
		}
		mu.Unlock()
	}

	mu.Lock()
	delete(rooms[roomID], username)
	mu.Unlock()
	log.Printf("User '%s' disconnected from room '%s'\n", username, roomID)
}

func main() {
	http.Handle("/", http.FileServer(http.Dir("./static")))
	http.HandleFunc("/websocket", webSocketHandler)

	log.Println("Server started on :3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}
