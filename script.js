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
    const status = getStatus();

    const moveIllegal = !validateMove(index, status);
    if (moveIllegal) return;

    const marker = status.currentPlayer.getMarker();
    Gameboard.setCell(index, marker);

    winner = checkWinner(status);
    if (winner === undefined) {
      switchPlayer();
    } else {
      gameOver = true;
    }
  }

  function validateMove(index, { board, gameOver }) {
    const illegalMoves = {
      gameOver,
      cellOccupied: board[index],
    };
    const isIllegal = Object.values(illegalMoves).some(Boolean);
    return !isIllegal;
  }

  function checkWinner({ currentPlayer }) {
    const { board } = getStatus();
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
        return (winner = currentPlayer);
      }
    }

    const boardFull = board.every((marker) => marker);
    if (boardFull) {
      return (winner = null);
    }

    return undefined;
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

  function init() {
    const status = GameController.getStatus();

    buildGameboard(status);
    gameboardNode.addEventListener("click", handleMove);

    resetButton.addEventListener("click", handleReset);

    render();

    function buildCell(index) {
      const node = document.createElement("button");
      node.className = "cell";
      node.dataset.index = index;
      return node;
    }

    function buildGameboard({ board }) {
      const cellButtons = board.map((_, index) => buildCell(index));
      gameboardNode.append(...cellButtons);
    }

    function handleMove({ target }) {
      const cellNode = target.closest(".cell");
      if (cellNode) {
        const index = Number(cellNode.dataset.index);
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

    function renderGameboard({ board, currentPlayer }) {
      const cellButtons = gameboardNode.querySelectorAll(".cell");
      const currentMarker = currentPlayer.getMarker();

      cellButtons.forEach((node, index) => {
        const marker = board[index];

        const isEmpty = !marker;
        node.classList.toggle("empty", isEmpty);

        const markerImage = buildMarkerImage(marker || currentMarker, isEmpty);
        node.replaceChildren(markerImage);
      });
    }

    function buildMarkerImage(marker, preview = false) {
      const node = document.createElement("img");
      node.src = `assets/${marker}.svg`;
      node.className = `glyph ${preview ? "preview" : ""}`;
      return node;
    }

    function renderDialog({ winner }) {
      let message = "";

      if (winner) {
        const winnerMarker = winner.getMarker();
        const markerSpan = buildMarkerSpan(winnerMarker);
        message = `${markerSpan.outerHTML} wins.`;
      } else {
        message = "Tie.";
      }

      messageNode.innerHTML = message;
    }

    function buildMarkerSpan(marker) {
      const node = document.createElement("span");
      node.className = "marker-span";
      node.dataset.marker = marker;
      node.textContent = `${marker.toUpperCase()}`;
      return node;
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
