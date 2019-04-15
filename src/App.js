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

class Board extends Component {
  renderPosition() {
    const {turn, position, selected: [location, rank, file], orientation, handleClick} = this.props;
    const rows = position.map((row, i) =>
        <div key={[i, row, location === ON_BOARD && i === rank]}>
          {row.map((piece, j) => {
            return <Square
                piece={piece}
                key={[j, piece, location === ON_BOARD && i === rank && j === file]}
                onClick={location || piece.startsWith(turn) ? () => handleClick(ON_BOARD, i, j) : null}
                selected={location === ON_BOARD && i === rank && j === file}
            />;
          })}
        </div>);
    if (orientation === BLACK) {
      rows.reverse();
    }
    return (
        <div className="board">
          {rows}
        </div>
    );
  }

  renderDrops(side) {
    const drops = this.props.drops[side];
    const [location, colour, index] = this.props.selected;
    if (drops.length > 0) {
      return drops.map((drop, i) =>
          <Square
              piece={drop}
              onClick={side === this.props.turn ? () => this.props.handleClick(FROM_DROPS, side, i) : null}
              key={[i, drop, (location === FROM_DROPS && colour === side && index === i)]}
              selected={location === FROM_DROPS && colour === side && index === i}
          />
      )
    }
    return <Square/>;
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
    return <div className="game" data-turn={this.state.turn}>
      <div className="nes-container is-rounded player-label">
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
      <div className="nes-container is-rounded player-label">
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
            <div className="game-container nes-container with-title">
              <p className="title">Room 1</p>
              <div className="boards">
                <Game online={process.env.REACT_APP_ONLINE_MODE}/>
                <Game online={process.env.REACT_APP_ONLINE_MODE} orientation={BLACK}/>
              </div>
            </div>
          </main>
        </div>
    );
  }
}

export default App;
