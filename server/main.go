package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

var StartingPosition = [][]string{
	{"bR", "bH", "bE", "bA", "bG", "bA", "bE", "bH", "bR"},
	{"", "", "", "", "", "", "", "", ""},
	{"", "bC", "", "", "", "", "", "bC", ""},
	{"bP", "", "bP", "", "bP", "", "bP", "", "bP"},
	{"", "", "", "", "", "", "", "", ""},
	{"", "", "", "", "", "", "", "", ""},
	{"rP", "", "rP", "", "rP", "", "rP", "", "rP"},
	{"", "rC", "", "", "", "", "", "rC", ""},
	{"", "", "", "", "", "", "", "", ""},
	{"rR", "rH", "rE", "rA", "rG", "rA", "rE", "rH", "rR"},
}

type Coordinate struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Move struct {
	From Coordinate `json:"from"`
	To   Coordinate `json:"to"`
}

type Game struct {
	Position       [][]string
	Turn           string
	Moves          chan Move
	newClients     chan chan GameState
	closingClients chan chan GameState
	clients        map[chan GameState]struct{}
}

type GameState struct {
	Position [][]string `json:"position"`
	Turn     string     `json:"turn"`
}

func duplicate(board [][]string) [][]string {
	dup := make([][]string, len(board))
	for i := range board {
		dup[i] = make([]string, len(board[i]))
		copy(dup[i], board[i])
	}
	return dup
}

func (g *Game) handleMove(w http.ResponseWriter, r *http.Request) {
	var m Move
	err := json.NewDecoder(r.Body).Decode(&m)
	if err != nil {
		panic(err)
	}
	g.Moves <- m
}

func (g *Game) sendUpdates(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}
	// Set the headers related to event streaming.
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	c := make(chan GameState)
	g.newClients <- c
	defer func() {
		g.closingClients <- c
	}()

	go func() {
		// Listen to connection close and unregister client
		<-r.Context().Done()
		g.closingClients <- c
	}()

	for {
		// Write to the ResponseWriter
		// Server Sent Events compatible
		board := <-c
		JSON, err := json.Marshal(board)
		if err != nil {
			panic(err)
		}
		_, _ = fmt.Fprintf(w, "data: %s\n\n", string(JSON))

		// Flush the data immediately instead of buffering it for later.
		flusher.Flush()
	}
}

func (g *Game) Start() {
	for {
		select {
		case s := <-g.newClients:
			// A new client has connected.
			// Register their message channel
			g.clients[s] = struct{}{}
			log.Printf("Client added. %d registered clients", len(g.clients))
			// Send current board state to new client
			s <- GameState{
				Position: g.Position,
				Turn:     g.Turn,
			}

		case s := <-g.closingClients:
			// A client has detached and we want to
			// stop sending them messages.
			delete(g.clients, s)
			log.Printf("Removed client. %d registered clients", len(g.clients))

		case move := <-g.Moves:
			// We got a new event from the outside!
			g.Position[move.To.X][move.To.Y] = g.Position[move.From.X][move.From.Y]
			g.Position[move.From.X][move.From.Y] = ""
			if g.Turn == "r" {
				g.Turn = "b"
			} else {
				g.Turn = "r"
			}
			// Send event to all connected clients
			for clientMessageChan := range g.clients {
				clientMessageChan <- GameState{
					Position: g.Position,
					Turn:     g.Turn,
				}
			}
		}
	}
}

func main() {
	game := Game{
		Position:       StartingPosition,
		Turn:           "r",
		Moves:          make(chan Move),
		newClients:     make(chan chan GameState),
		closingClients: make(chan chan GameState),
		clients:        make(map[chan GameState]struct{}),
	}
	go game.Start()

	http.HandleFunc("/moves", game.handleMove)
	http.HandleFunc("/", game.sendUpdates)

	port := "localhost"
	if portFromEnv := os.Getenv("PORT"); portFromEnv != "" {
		port = portFromEnv
	}

	log.Fatal("HTTP server error: ", http.ListenAndServe(":"+port, nil))
}
