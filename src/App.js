import React, { Component } from 'react';
import './App.css';

const STARTING_POSITION = [
  ['rR', 'rH', 'rE', 'rA', 'rG', 'rA', 'rE', 'rH', 'rR'],
  ['', '', '', '', '', '', '', '', ''],
  ['', 'rC', '', '', '', '', '', 'rC', ''],
  ['rP', '', 'rP', '', 'rP', '', 'rP', '', 'rP'],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['bP', '', 'bP', '', 'bP', '', 'bP', '', 'bP'],
  ['', 'bC', '', '', '', '', '', 'bC', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['bR', 'bH', 'bE', 'bA', 'bG', 'bA', 'bE', 'bH', 'bR'],
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
  createBoard() {
    const board = this.props.board;
    const rows = [];
    for (let i = 0; i < board.length; i++) {
      const squares = [];
      const row = board[i];
      for (let j = 0; j < row.length; j++) {
        const piece = row[j];
          squares.push(<Square piece={piece} key={[j, piece]}
                               onClick={() => console.log(`clicked square at ${i},${j}`)}/>);
      }
      rows.push(<div key={[i, row]}>{squares}</div>)
    }
    return rows;
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
