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
  const classes = ['square'];
  if (props.piece) {
    classes.push(`piece-${props.piece}`);
  }
  return (
      <div className={classes.join(' ')} onClick={props.onClick} data-selected={props.selected || null}/>
  );
}

class Board extends Component {
  constructor(props) {
    super(props);
    this.state = {
      board: props.board,
      selected: [null, null],
    };
  }

  handleClick(i, j) {
    const [x, y] = this.state.selected;
    if (i === x && j === y) {
      this.setState({
        selected: [null, null],
      });
    } else if (x && y) {
      const piece = this.state.board[x][y];
      const board = this.state.board.map(row => row.slice());
      board[i][j] = piece;
      board[x][y] = '';
      this.setState({
        board,
        selected: [null, null],
      })
    } else if (this.state.board[i][j]) {
      this.setState({
        selected: [i, j],
      });
    }
  }

  createBoard() {
    const [x, y] = this.state.selected;
    return this.state.board.map((row, i) =>
        <div key={[i, row, i === x]}>
          {row.map((piece, j) => {
            return <Square
                piece={piece}
                key={[j, piece, i === x && j === y]}
                onClick={() => this.handleClick(i, j)}
                selected={i === x && j === y}
            />;
          })}
        </div>);
  }

  render() {
    return (
        <div>
          {this.createBoard()}
        </div>
    );
  }
}

class App extends Component {
  render() {
    return (
        <div className="App">
          <header className="App-header">
            <Board board={STARTING_POSITION}/>
          </header>
        </div>
    );
  }
}

export default App;
