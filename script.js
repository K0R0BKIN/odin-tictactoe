const Gameboard = (function () {
  const board = Array(9).fill(null);

  function getBoard() {
    return board;
  }

  function setCell(cellIndex, marker) {
    board[cellIndex] = marker;
  }

  return { getBoard, setCell };
})();

function createPlayer(name, marker) {

  function getName() {
    return name;
  }

  function getMarker() {
    return marker;
  }

  return { getName, getMarker };
}

const Game = (function () {
  const MARKERS = ["X", "O"];
  const players = [
    createPlayer("Player 1", MARKERS[0]),
    createPlayer("Player 2", MARKERS[1])
  ];

  let currentPlayer = players[0];
  let winner;

  function makeMove(cellIndex) {
    const marker = currentPlayer.getMarker();
    Gameboard.setCell(cellIndex, marker);
    checkWinner();

    if (winner === undefined) {
      switchPlayer();
    }
  }

  function switchPlayer() {
    currentPlayer = currentPlayer === players[0] ? players[1] : players[0];
  }

  function checkWinner() {
    const board = Gameboard.getBoard();

    const WINNING_COMBINATIONS = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const combination of WINNING_COMBINATIONS) {
      for (const player of players) {
        const marker = player.getMarker();
        const isWinning = combination.every(cellIndex => board[cellIndex] === marker);
        if (isWinning) {
          winner = player;
          gameOver();
          return;
        }
      }
    }

    if (board.every(cell => cell != null)) {
      winner = null;
      gameOver();
      return;
    }
  }

  function gameOver() {
    console.log("Game over.")
    if (winner === null) {
      console.log("Tie.")
    } else {
      const winnerName = winner.getName();
      console.log(`${winnerName} wins.`)
    }
  }

  return { makeMove };
})();

Game.makeMove(0);
Game.makeMove(1);
Game.makeMove(3);
Game.makeMove(7);
Game.makeMove(6);