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

const RED = 'r';
const BLACK = 'b';

const ON_BOARD = 1;
const FROM_DROPS = 2;

function Square({piece, selected, onClick}) {
  return (
      <div
          className="square"
          data-side={piece ? piece[0] : null}
          data-piece={piece || null}
          data-selected={selected || null}
          onClick={onClick}
      />
  );
}

class Board extends Component {
  renderPosition() {
    const {turn, position, selected: [location, rank, file], orientation, handleClick} = this.props;
    const rows = position.map((pieces, i) => ({
      key: [i, pieces],
      pieces: pieces.map((piece, j) => ({piece, key: [j, piece], selected: false}))
    }));
    if (location === ON_BOARD) {
      rows[rank].key.push(true);
      rows[rank].pieces[file].selected = true;
      rows[rank].pieces[file].key.push(true);
    }
    const board = rows.map(({key, pieces}, i) =>
        <div key={key}>
          {pieces.map(({piece, key, selected}, j) => {
            return <Square
                piece={piece}
                key={key}
                onClick={location || piece.startsWith(turn) ? () => handleClick(ON_BOARD, i, j) : null}
                selected={selected}
            />;
          })}
        </div>);
    if (orientation === BLACK) {
      board.reverse();
    }
    return (
        <div className="board">
          {board}
        </div>
    );
  }

  renderDrops(side) {
    const drops = this.props.drops[side];
    const [location, colour, index] = this.props.selected;
    return drops.map((drop, i) =>
        <Square
            piece={drop}
            onClick={side === this.props.turn ? () => this.props.handleClick(FROM_DROPS, side, i) : null}
            key={[i, drop, (location === FROM_DROPS && colour === side && index === i)]}
            selected={location === FROM_DROPS && colour === side && index === i}
        />
    )
  }

  render() {
    return (
        <div data-action={this.props.selected[0] ? 'placing' : 'picking'}>
          <div className="drops">
            {this.renderDrops(this.props.orientation === RED ? BLACK : RED)}
          </div>
          {this.renderPosition()}
          <div className="drops">
            {this.renderDrops(this.props.orientation)}
          </div>
        </div>
    );
  }
}

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      board: STARTING_POSITION,
      drops: {r: [], b: []},
      turn: RED,
      selected: [null, null, null],
      orientation: this.props.orientation || RED,
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

  handleClick(l, i, j) {
    const [location, x, y] = this.state.selected;
    // if the selected piece is clicked again, unselect it
    if (l === location && i === x && j === y) {
      this.setState({
        selected: [null, null, null],
      });
    } else
    // if a piece is currently selected and the clicked position is on the board,
    // move it to the clicked position and unselect it
    // and update whose turn it is
    if (location !== null && l === ON_BOARD) {
      const piece = location === ON_BOARD ? this.state.board[x][y] : this.state.drops[x][y];
      const board = this.state.board.map(row => row.slice());
      const drops = {
        r: this.state.drops.r.slice(),
        b: this.state.drops.b.slice(),
      };
      const eaten = board[i][j];
      board[i][j] = piece;
      if (location === ON_BOARD) {
        board[x][y] = '';
      } else {
        drops[x].splice(y, 1);
      }
      if (eaten) {
        if (eaten[0] === RED) {
          drops.b.push(BLACK + eaten.substr(1));
        } else {
          drops.r.push(RED + eaten.substr(1));
        }
      }
      this.setState({
        board,
        drops,
        turn: this.state.turn === RED ? BLACK : RED,
        selected: [null, null, null],
      });
      if (this.online) {
        this.postMove(x, y, i, j);
      }
    } else {
      this.setState({
        selected: [l, i, j],
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
    return <div data-turn={this.state.turn}>
      <div>
        <p>
          <span className="turn-indicator"
                data-side={this.state.orientation === RED ? BLACK : RED}
          >(*) </span>Player 2</p>
      </div>
      <Board
          turn={this.state.turn}
          position={this.state.board}
          selected={this.state.selected}
          orientation={this.state.orientation}
          drops={this.state.drops}
          handleClick={(l, i, j) => this.handleClick(l, i, j)}
      />
      <div>
        <p>
          <span className="turn-indicator"
                data-side={this.state.orientation}
          >(*) </span>Player 1</p>
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
