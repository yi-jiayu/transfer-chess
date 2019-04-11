import React, { Component } from 'react';
import './App.css';

function Square(props) {
  const classes = ['square'];
  if (props.piece) {
    classes.push(`piece-${props.piece}`);
  }
  return (
      <div className={classes.join(' ')}/>
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
        squares.push(<Square piece={piece} key={[i, j]}/>);
      }
      rows.push(<div key={i}>{squares}</div>)
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
            <p>
              Edit <code>src/App.js</code> and save to reload.
            </p>
            <Board board={
              [
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
              ]
            }/>
            <a
                className="App-link"
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
            >
              Learn React
            </a>
          </header>
        </div>
    );
  }
}

export default App;
