import React, { Component } from 'react';
import './App.css';

const STARTING_POSITION = [
  ['bR', 'bH', 'bE', 'bA', 'bG', 'bA', 'bE', 'bH', 'bR'],
  ['', '', '', '', '', '', '', '', ''],
  ['', 'bC', '', '', '', '', '', 'bC', ''],
  ['bP', '', 'bP', '', 'bP', '', 'bP', '', 'bP'],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['rP', '', 'rP', '', 'rP', '', 'rP', '', 'rP'],
  ['', 'rC', '', '', '', '', '', 'rC', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['rR', 'rH', 'rE', 'rA', 'rG', 'rA', 'rE', 'rH', 'rR'],
];


function Square(props) {
  return (
      <div
          className="square"
          onClick={props.onClick}
          data-side={props.piece ? props.piece[0] : null}
          data-piece={props.piece || null}
          data-selected={props.selected || null}
      />
  );
}

function Board({position, turn, selected: [x, y], orientation, handleClick}) {
  const board = position.map((row, i) =>
      <div key={[i, row, i === x]}>
        {row.map((piece, j) => {
          return <Square
              piece={piece}
              key={[j, piece, i === x && j === y]}
              onClick={() => handleClick(i, j)}
              selected={i === x && j === y}
          />;
        })}
      </div>);
  if (orientation === 'b') {
    board.reverse();
  }
  return (
      <div className="board"
           data-action={x !== null && y !== null ? 'placing' : 'picking'}>
        {board}
      </div>
  );
}

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      board: STARTING_POSITION,
      turn: 'r',
      selected: [null, null],
      orientation: 'r',
    };
    this.online = props.online || false;
  }

  componentDidMount() {
    if (this.online) {
      this.api_host = process.env.REACT_APP_API_HOST;
      this.client = new EventSource(this.api_host);
      this.client.onmessage = msg => {
        const data = JSON.parse(msg.data);
        this.setState({
          board: data.position,
          turn: data.turn,
        });
      };
    }
  }

  handleClick(i, j) {
    const [x, y] = this.state.selected;
    // if the selected piece is clicked again, unselect it
    if (i === x && j === y) {
      this.setState({
        selected: [null, null],
      });
    } else
    // if a piece is currently selected, move it to the clicked position and unselect it
    // and update whose turn it is
    if (x !== null && y !== null) {
      const piece = this.state.board[x][y];
      const board = this.state.board.map(row => row.slice());
      board[i][j] = piece;
      board[x][y] = '';
      this.setState({
        board,
        turn: this.state.turn === 'r' ? 'b' : 'r',
        selected: [null, null],
      });
      if (this.online) {
        this.postMove(x, y, i, j);
      }
    } else
    // if a piece is clicked and it is that side's turn, make it the selected piece
    if (this.state.board[i][j] && this.state.board[i][j].startsWith(this.state.turn)) {
      this.setState({
        selected: [i, j],
      });
    }
  }

  postMove(x, y, i, j) {
    fetch(`${this.api_host}/moves`, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        from: {x, y},
        to: {x: i, y: j},
      })
    }).catch(console.error);
  }

  render() {
    return <div className="game nes-container with-title" data-turn={this.state.turn}>
      <p className="title">Room 1</p>
      <div className="nes-container is-rounded player-label">
        <p><span className="turn-indicator" data-side="b">(*) </span>Player 2</p>
      </div>
      <Board
          position={this.state.board}
          selected={this.state.selected}
          orientation={this.state.orientation}
          handleClick={(i, j) => this.handleClick(i, j)}
      />
      <div className="nes-container is-rounded player-label">
        <p><span className="turn-indicator" data-side="r">(*) </span>Player 1</p>
      </div>
    </div>
  }
}

class App extends Component {
  render() {
    return (
        <div className="App">
          <main className="App-content">
            <Game online={process.env.REACT_APP_ONLINE_MODE}/>
          </main>
        </div>
    );
  }
}

export default App;
