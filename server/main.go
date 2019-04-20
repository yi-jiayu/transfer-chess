package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

const (
	Red   = 0
	Black = 1

	OnBoard   = 0
	FromDrops = 1
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
	Location int `json:"location"`
	X        int `json:"x"`
	Y        int `json:"y"`
}

type Move struct {
	Table int        `json:"table"`
	From  Coordinate `json:"from"`
	To    Coordinate `json:"to"`
}

type Board struct {
	Position   [][]string `json:"position"`
	RedDrops   []string   `json:"red_drops"`
	BlackDrops []string   `json:"black_drops"`
	Turn       string     `json:"turn"`
	Previous   [][]int    `json:"previous"`
}

type Game struct {
	Boards         []Board
	Moves          chan Move
	newClients     chan chan GameState
	closingClients chan chan GameState
	clients        map[chan GameState]struct{}
}

type GameState []Board

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
	w.Header().Set("Access-Control-Allow-Origin", "*")

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
			// Send current position state to new client
			s <- GameState(g.Boards)

		case s := <-g.closingClients:
			// A client has detached and we want to
			// stop sending them messages.
			delete(g.clients, s)
			log.Printf("Removed client. %d registered clients", len(g.clients))

		case move := <-g.Moves:
			// We got a new event from the outside!
			board := &g.Boards[move.Table]

			var piece string
			if move.From.Location == OnBoard {
				piece = board.Position[move.From.X][move.From.Y]
			} else {
				if move.From.X == Red {
					piece = board.RedDrops[move.From.Y]
				} else {
					piece = board.BlackDrops[move.From.Y]
				}
			}
			eaten := board.Position[move.To.X][move.To.Y]
			board.Position[move.To.X][move.To.Y] = piece
			previous := [][]int{{move.To.X, move.To.Y}}
			if move.From.Location == OnBoard {
				board.Position[move.From.X][move.From.Y] = ""
				previous = append(previous, []int{move.From.X, move.From.Y})
			} else {
				if move.From.X == Red {
					board.RedDrops = append(board.RedDrops[:move.From.Y], board.RedDrops[move.From.Y+1:]...)
				} else {
					board.BlackDrops = append(board.BlackDrops[:move.From.Y], board.BlackDrops[move.From.Y+1:]...)
				}
			}
			board.Previous = previous
			if board.Turn == "r" {
				board.Turn = "b"
			} else {
				board.Turn = "r"
			}
			if eaten != "" {
				if eaten[0] == 'r' {
					g.Boards[1-move.Table].BlackDrops = append(g.Boards[1-move.Table].BlackDrops, "b"+piece[1:])
				} else {
					g.Boards[1-move.Table].RedDrops = append(g.Boards[1-move.Table].RedDrops, "r"+piece[1:])
				}
			}
			// Send event to all connected clients
			for clientMessageChan := range g.clients {
				clientMessageChan <- GameState(g.Boards)
			}
		}
	}
}

func main() {
	game := Game{
		Boards: []Board{
			{
				Position:   duplicate(StartingPosition),
				RedDrops:   []string{},
				BlackDrops: []string{},
				Turn:       "r",
				Previous:   [][]int{},
			},
			{
				Position:   duplicate(StartingPosition),
				RedDrops:   []string{},
				BlackDrops: []string{},
				Turn:       "r",
				Previous:   [][]int{},
			},
		},
		Moves:          make(chan Move),
		newClients:     make(chan chan GameState),
		closingClients: make(chan chan GameState),
		clients:        make(map[chan GameState]struct{}),
	}
	go game.Start()

	http.HandleFunc("/moves", game.handleMove)
	http.HandleFunc("/", game.sendUpdates)

	port := "4000"
	if portFromEnv := os.Getenv("PORT"); portFromEnv != "" {
		port = portFromEnv
	}

	log.Fatal("HTTP server error: ", http.ListenAndServe(":"+port, nil))
}
