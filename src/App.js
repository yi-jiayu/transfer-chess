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
      <div className={classes.join(' ')} onClick={props.onClick}/>
  );
}

class Board extends Component {
  constructor(props) {
    super(props);
    this.state = {
      board: props.board,
    };
  }

  handleClick(i, j) {
    if (this.state.board[i][j]) {
      console.log(`clicked ${this.state.board[i][j]} at ${i},${j}`);
    }
  }

  createBoard() {
    return this.state.board.map((row, i) =>
        <div key={[i, row]}>
          {row.map((piece, j) => {
            return <Square
                piece={piece}
                key={[j, piece]}
                onClick={() => this.handleClick(i, j)}
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
