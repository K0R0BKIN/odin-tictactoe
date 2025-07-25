const Gameboard = (function () {
  let board;

  function init() {
    board = Array(9).fill(null);
  }

  function setCell(index, marker) {
    board[index] = marker;
    return GameController.getStatus();
  }

  function getBoard() {
    return [...board];
  }

  return { setCell, getBoard, init };
})();

const MARKERS = {
  x: { color: "red", glyphPath: "/assets/x.svg" },
  o: { color: "blue", glyphPath: "/assets/o.svg" },
};

function createPlayer(markerId) {
  const name = markerId.toUpperCase();
  const marker = { ...MARKERS[markerId], id: markerId };

  return {
    getName: () => name,
    getMarker: () => marker,
  };
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

    return getStatus();
  }

  function playRound(index) {
    const status = getStatus();

    // The UI blocks illegal moves; this is just a nice‑to‑have fallback.
    const moveIllegal = !validateMove(index, status);
    if (moveIllegal) return;

    const marker = status.currentPlayer.getMarker();
    status = Gameboard.setCell(index, marker);

    winner = checkWinner(status);
    if (winner === undefined) {
      switchPlayer();
    } else {
      gameOver = true;
    }

    return status;

    function validateMove(index, { board, gameOver }) {
      const illegalMoves = {
        gameOver,
        cellOccupied: board[index] !== null,
      };
      const isIllegal = Object.values(illegalMoves).some(Boolean);
      return !isIllegal;
    }

    function checkWinner({ board, currentPlayer }) {
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

      const currentMarker = currentPlayer.getMarker();
      for (const pattern of WIN_PATTERNS) {
        const matchesMarker = pattern.every(
          (index) => board[index] === currentMarker
        );
        if (matchesMarker) {
          return {
            player: currentPlayer,
            marker: currentMarker,
            pattern: pattern,
          };
        }
      }

      const boardFull = board.every((marker) => marker !== null);
      if (boardFull) {
        return null;
      }

      return undefined;
    }

    function switchPlayer() {
      currentPlayer = currentPlayer === players[0] ? players[1] : players[0];
    }
  }

  function getStatus() {
    return {
      board: Gameboard.getBoard(),
      currentPlayer,
      gameOver,
      winner,
    };
  }

  return { playRound, getStatus, init };
})();

const DisplayController = (function () {
  const gameboardContainer = document.querySelector("#gameboard");

  const dialog = document.querySelector("#dialog");
  const messageParagraph = dialog.querySelector("#message");
  const resetButton = dialog.querySelector("#reset-button");

  function init(status) {
    buildGameboard(status);

    gameboardContainer.addEventListener("click", handleMove);
    resetButton.addEventListener("click", handleReset);

    render(status);

    function buildCell(index) {
      const node = document.createElement("button");
      node.className = "cell";
      node.dataset.index = index;
      return node;
    }

    function buildGameboard({ board }) {
      const cellButtons = board.map((_, index) => buildCell(index));
      gameboardContainer.append(...cellButtons);
    }

    function handleMove({ target }) {
      const cellNode = target.closest(".cell");
      if (cellNode) {
        const index = Number(cellNode.dataset.index);
        const currentRound = GameController.playRound(index);
        render(currentRound);
      }
    }

    function handleReset() {
      dialog.close();

      const gameStart = GameController.init();
      render(gameStart);
    }
  }


  function render(status) {
    renderGameboard(status);

    if (status.gameOver) {
      renderDialog(status);
      dialog.showModal();
    }

    function renderGameboard({ board, currentPlayer, gameOver, winner }) {
      const cellButtons = gameboardContainer.querySelectorAll(".cell");
      const currentMarker = currentPlayer.getMarker();

      cellButtons.forEach((node, index) => {
        const marker = board[index];

        const isEmpty = marker === null;
        node.classList.toggle("empty", isEmpty);
        node.toggleAttribute("disabled", !isEmpty || gameOver);

        const markerImage = buildMarkerImage(marker || currentMarker, isEmpty);
        const isWinning = winner?.pattern.includes(index);
        markerImage.classList.toggle("dimmed", gameOver && !isWinning);
        node.replaceChildren(markerImage);
      });
    }

    function buildMarkerImage(marker, preview = false) {
      const node = document.createElement("img");
      node.src = marker.glyphPath;
      node.className = "glyph";
      node.classList.toggle("preview", preview);
      return node;
    }

    function renderDialog({ winner }) {
      if (winner) {
        const playerNameSpan = buildPlayerNameSpan(winner);
        messageParagraph.replaceChildren(playerNameSpan, " wins.");
      } else {
        messageParagraph.replaceChildren("Tie.");
      }
    }

    function buildPlayerNameSpan({ player, marker }) {
      const node = document.createElement("span");
      node.className = "player-name";
      node.dataset.marker = marker.id;
      node.textContent = player.getName();
      node.style.color = marker.color;
      return node;
    }
  }

  return { init, render };
})();

const gameStart = GameController.init();
DisplayController.init(gameStart);
