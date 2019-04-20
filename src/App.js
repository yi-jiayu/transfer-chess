import React, { Component } from 'react';
import { fromJS, List, Map } from 'immutable';

import './App.css';

const STARTING_POSITION = fromJS([
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
]);

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
    const {turn, position, selected: [location, rank, file], orientation, previous, handleClick} = this.props;
    let rows = position.map((pieces, i) => ({
      key: Map({
        index: i,
        pieces,
        highlighted: List(),
      }),
      pieces: pieces.map((piece, j) => ({piece, key: [j, piece, false], selected: false}))
    }));
    if (location === ON_BOARD) {
      rows = rows.withMutations(rows =>
          rows.updateIn([rank, 'key', 'highlighted'], k => k.push(file))
              .setIn([rank, 'pieces', file, 'selected'], true)
              .setIn([rank, 'pieces', file, 'key', 2], true));
    }
    for (const [rank, file] of previous) {
      rows = rows.withMutations(rows =>
          rows.updateIn([rank, 'key', 'highlighted'], k => k.push(file))
              .setIn([rank, 'pieces', file, 'selected'], true)
              .setIn([rank, 'pieces', file, 'key', 2], true));
    }
    let board = rows.map(({key, pieces}, i) =>
        <div key={key.valueSeq().toJS()}>
          {pieces.map(({piece, key, selected}, j) =>
              <Square
                  piece={piece}
                  key={key}
                  onClick={location || piece.startsWith(turn) ? () => handleClick(ON_BOARD, i, j) : null}
                  selected={selected}
              />)}
        </div>);
    if (orientation === BLACK) {
      board = board.reverse();
    }
    return board;
  }

  renderDrops(side) {
    const drops = this.props.drops.get(side);
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
          <div className="board">
            {this.renderPosition()}
          </div>
          <div className="drops">
            {this.renderDrops(this.props.orientation)}
          </div>
        </div>
    );
  }
}

function Table({turn, orientation, position, drops, selected, previous, handleClick}) {
  return <div data-turn={turn}>
    <div>
      <span className="turn-indicator"
            data-side={orientation === RED ? BLACK : RED}>(*) </span>Player 2
    </div>
    <Board
        turn={turn}
        position={position}
        selected={selected}
        orientation={orientation}
        drops={drops}
        previous={previous}
        handleClick={(l, i, j) => handleClick(l, i, j)}
    />
    <div>
      <span className="turn-indicator"
            data-side={orientation}>(*) </span>Player 1
    </div>
  </div>

}

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tables: List([
        Map({
          position: STARTING_POSITION,
          drops: fromJS({r: [], b: []}),
          turn: RED,
          selected: [null, null, null],
          orientation: RED,
          previous: [],
        }),
      ]),
    };
  }

  handleClick(t, l, i, j) {
    let table = this.state.tables.get(t);
    const [location, x, y] = table.get('selected');
    // if the selected piece is clicked again, unselect it
    if (l === location && i === x && j === y) {
      this.setState({
        tables: this.state.tables.setIn([t, 'selected'], [null, null, null]),
      });
    } else
    // if a piece is currently selected and the clicked position is on the board,
    // move it to the clicked position and unselect it
    // and update whose turn it is
    if (location !== null && l === ON_BOARD) {
      const piece = location === ON_BOARD ? table.getIn(['position', x, y]) : table.getIn(['drops', x, y]);
      let board = table.get('position');
      let drops = table.get('drops');
      const previous = [[i, j]];
      const eaten = board.getIn([i, j]);
      board = board.setIn([i, j], piece);
      if (location === ON_BOARD) {
        board = board.setIn([x, y], '');
        previous.push([x, y]);
      } else {
        drops = drops.deleteIn([x, y])
      }
      if (eaten) {
        if (eaten[0] === RED) {
          drops = drops.update(BLACK, d => d.push(BLACK + eaten.substr(1)));
        } else {
          drops = drops.update(RED, d => d.push(RED + eaten.substr(1)));
        }
      }
      this.setState({
        tables: this.state.tables.update(t, tb => tb.merge(Map({
          position: board,
          drops,
          turn: table.get('turn') === RED ? BLACK : RED,
          selected: [null, null, null],
          previous,
        }))),
      });
    } else {
      this.setState({
        tables: this.state.tables.setIn([t, 'selected'], [l, i, j]),
      });
    }
  }


  render() {
    return (
        <div>
          <Table
              turn={this.state.tables.getIn([0, 'turn'])}
              orientation={this.state.tables.getIn([0, 'orientation'])}
              position={this.state.tables.getIn([0, 'position'])}
              drops={this.state.tables.getIn([0, 'drops'])}
              selected={this.state.tables.getIn([0, 'selected'])}
              previous={this.state.tables.getIn([0, 'previous'])}
              handleClick={(l, i, j) => this.handleClick(0, l, i, j)}
          />
        </div>
    );
  }
}

class App extends Component {
  render() {
    return (
        <div className="App">
          <main className="App-content">
            <Game/>
          </main>
        </div>
    );
  }
}

export default App;
