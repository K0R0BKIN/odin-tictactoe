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

function createPlayer(marker) {
  function makeMove(cellIndex) {
    const board = Gameboard.getBoard();

    const cellValue = board[cellIndex];
    const gameOver = Game.getStatus().isOver;
    const ILLEGAL_MOVES = {
      cellOverwrite: cellValue !== null,
      gameOver: gameOver,
    };
    const isIllegal = Object.values(ILLEGAL_MOVES).some((check) => check);
    if (isIllegal) return;

    Gameboard.setCell(cellIndex, marker);
    Game.handleMove();
  }

  function getMarker() {
    return marker;
  }

  return { makeMove, getMarker };
}

const Game = (function () {
  const MARKERS = ["X", "O"];
  const players = [createPlayer(MARKERS[0]), createPlayer(MARKERS[1])];
  const [player1, player2] = players;

  const status = {
    currentPlayer: player1,
    isOver: false,
    winner: undefined,
  };

  function getStatus() {
    return status;
  }

  function handleMove() {
    status.winner = checkWinner();

    if (status.winner === undefined) {
      switchPlayer();
    } else {
      gameOver(status.winner);
    }
  }

  function switchPlayer() {
    status.currentPlayer = status.currentPlayer === player1 ? player2 : player1;
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
        const isWinning = combination.every((cellIndex) => {
          const cellValue = board[cellIndex];
          return cellValue === marker;
        });
        if (isWinning) {
          return player;
        }
      }
    }

    if (board.every((cellValue) => cellValue != null)) {
      return null;
    }

    return undefined;
  }

  function gameOver(winner) {
    status.isOver = true;
  }

  return { getStatus, handleMove };
})();

const DisplayController = (function () {
  const gameboard = document.querySelector("#gameboard");
  const boardData = Gameboard.getBoard();
  boardData.forEach((_, boardIndex) => {
    const cellNode = buildCell(boardIndex);
    gameboard.append(cellNode);
  });
  renderGameboard(gameboard);

  gameboard.addEventListener("click", (event) => {
    const node = event.target;
    const isCell = node.classList.contains("cell");
    if (isCell) handleMove(node);
  });
  document.body.append(gameboard);

  const statusboard = document.createElement("div");
  statusboard.id = "statusboard";
  renderStatusboard(statusboard);
  document.body.prepend(statusboard);

  function renderGameboard() {
    const node = gameboard;
    const boardData = Gameboard.getBoard();
    const cellNodes = node.querySelectorAll(".cell");
    cellNodes.forEach((node) => {
      let content = node.textContent;
      const index = node.dataset.index;
      const boardValue = boardData[index];
      if (!content && boardValue) {
        node.textContent = boardValue;
      }
    });
  }

  function buildCell(index) {
    const node = document.createElement("button");
    node.className = "cell";
    node.dataset.index = index;
    return node;
  }

  function handleMove(node) {
    const index = node.dataset.index;
    const player = Game.getStatus().currentPlayer;
    player.makeMove(index);
    renderGameboard();
    renderStatusboard();
  }

  function renderStatusboard() {
    const node = statusboard;
    const gameOver = Game.getStatus().isOver;
    if (gameOver) {
      node.textContent = "Game over. ";

      const winner = Game.getStatus().winner;
      if (winner === null) {
        node.textContent += "Tie.";
      } else {
        const winnerMarker = winner.getMarker();
        node.textContent += `${winnerMarker} wins.`;
      }
    } else {
      const currentPlayerMarker = Game.getStatus().currentPlayer.getMarker();
      node.textContent = `Current player: ${currentPlayerMarker}`;
    }
  }
})();
