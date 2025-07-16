const Gameboard = (function () {
  const board = Array(9).fill(null);

  function getBoard() {
    return board;
  }

  function setCell(cellIndex, marker) {
    board[cellIndex] = marker;
  }

  function setBoard(mockBoard) {
    mockBoard.forEach((marker, cellIndex) => {
      setCell(cellIndex, marker);
    });
  }

  return { getBoard, setCell, setBoard };
})();

function createPlayer(name, marker) {
  function makeMove(cellIndex) {
    Gameboard.setCell(cellIndex, marker);
    Game.handleMove();
  }

  function getName() {
    return name;
  }

  function getMarker() {
    return marker;
  }

  return { makeMove, getName, getMarker };
}

const Game = (function () {
  const MARKERS = ["X", "O"];
  const players = [
    createPlayer("Player 1", MARKERS[0]),
    createPlayer("Player 2", MARKERS[1]),
  ];
  const [player1, player2] = players;
  let currentPlayer = player1;

  function handleMove() {
    const winner = checkWinner();

    if (winner === undefined) {
      switchPlayer();
    } else {
      gameOver(winner);
    }
  }

  function switchPlayer() {
    currentPlayer = currentPlayer === player1 ? player2 : player1;
  }

  function checkWinner(board = Gameboard.getBoard()) {
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
        const isWinning = combination.every(
          (cellIndex) => board[cellIndex] === marker,
        );
        if (isWinning) {
          return player;
        }
      }
    }

    if (board.every((cellMarker) => cellMarker != null)) {
      return null;
    }

    return undefined;
  }

  function gameOver(winner) {
    console.log("Game over.");

    if (winner === null) {
      console.log("Tie.");
    } else {
      const winnerName = winner.getName();
      const winnerMarker = winner.getMarker();

      console.log(`${winnerName} ("${winnerMarker}") wins.`);
    }
  }

  function init(mockBoard) {
    Gameboard.setBoard(mockBoard);
    handleMove();
  }

  return { player1, player2, handleMove, init };
})();

// prettier-ignore
const MOCK_BOARDS = {
  tie: [
    "X", "O", "X",
    "X", "O", "X",
    "O", "X", "O",
  ],
  xWins: [
    "O", "O", "X",
    "X", "X", "X",
    "O", "X", "O",
  ],
};

Game.init(MOCK_BOARDS.tie);
