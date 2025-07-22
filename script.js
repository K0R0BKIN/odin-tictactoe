const Gameboard = (function () {
  let board;

  function init() {
    board = Array(9).fill(null);
  }

  function setCell(index, marker) {
    board[index] = marker;
  }

  function getBoard() {
    return [...board];
  }

  return { setCell, getBoard, init };
})();

function createPlayer(marker) {
  function getMarker() {
    return marker;
  }

  return { getMarker };
}

const GameController = (function () {
  let players;
  let currentPlayer;
  let gameOver;
  let winner;

  function init() {
    Gameboard.init();
    players = [createPlayer("x"), createPlayer("o")];

    currentPlayer = players[0];
    gameOver = false;
    winner = undefined;
  }

  function playRound(index) {
    const moveIllegal = !validateMove(index);
    if (moveIllegal) return;

    const { currentPlayer } = getStatus();
    const marker = currentPlayer.getMarker();
    Gameboard.setCell(index, marker);

    winner = checkWinner();
    if (winner === undefined) {
      switchPlayer();
    } else {
      gameOver = true;
    }
  }

  function validateMove(index) {
    const { board, gameOver } = getStatus();
    const illegalMoves = {
      gameOver,
      cellOccupied: board[index],
    };
    const isIllegal = Object.values(illegalMoves).some(Boolean);
    return !isIllegal;
  }

  function checkWinner() {
    const { board, currentPlayer } = getStatus();
    const WIN_PATTERNS = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    let winner;

    const currentMarker = currentPlayer.getMarker();
    for (const pattern of WIN_PATTERNS) {
      const matchesMarker = pattern.every(
        (index) => board[index] === currentMarker
      );
      if (matchesMarker) {
        winner = currentPlayer;
        return winner;
      }
    }

    const boardFull = board.every((marker) => marker);
    if (boardFull) {
      winner = null;
      return winner;
    }
  }

  function switchPlayer() {
    currentPlayer = currentPlayer === players[0] ? players[1] : players[0];
  }

  function getStatus() {
    return {
      board: Gameboard.getBoard(),
      currentPlayer,
      gameOver,
      winner,
    };
  }

  return { init, playRound, getStatus };
})();

const DisplayController = (function () {
  const gameboardNode = document.querySelector("#gameboard");

  const dialogNode = document.querySelector("#dialog");
  const messageNode = dialogNode.querySelector("#message");
  const resetButton = dialogNode.querySelector("#reset-button");
  const closeButton = dialogNode.querySelector("#close-button");

  function init() {
    buildGameboard();

    gameboardNode.addEventListener("click", handleMove);

    resetButton.addEventListener("click", handleReset);
    closeButton.addEventListener("click", () => dialogNode.close());

    render();

    function buildCell(index) {
      const node = document.createElement("button");
      node.className = "cell";
      node.dataset.index = index;
      return node;
    }

    function buildGameboard() {
      const { board } = GameController.getStatus();
      const cellButtons = board.map((_, index) => buildCell(index));
      gameboardNode.append(...cellButtons);
    }

    function handleMove({ target }) {
      const isCell = target.classList.contains("cell");
      if (isCell) {
        const index = Number(target.dataset.index);
        GameController.playRound(index);
        render();
      }
    }

    function handleReset() {
      GameController.init();
      render();
      dialogNode.close();
    }
  }

  function render() {
    const status = GameController.getStatus();

    renderGameboard(status);

    if (status.gameOver) {
      showDialog();
    }

    function renderGameboard({ board }) {
      const cellButtons = gameboardNode.querySelectorAll(".cell");
      cellButtons.forEach((node, index) => {
        node.textContent = board[index]?.toUpperCase();
      });
    }

    function renderDialog({ winner }) {
      let message = "";

      if (winner) {
        const winnerMarker = winner.getMarker();
        message = `${winnerMarker.toUpperCase()} wins.`;
      } else {
        message = "Tie.";
      }

      messageNode.textContent = message;
    }

    function showDialog() {
      renderDialog(status);
      dialogNode.showModal();
    }
  }

  return { init, render };
})();

GameController.init();
DisplayController.init();
