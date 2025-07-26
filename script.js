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

const MARKERS = {
  x: {
    color: "red",
    buildSVGShapes: (svgNS) => {
      const line1 = document.createElementNS(svgNS, "line");
      line1.setAttribute("x1", "10");
      line1.setAttribute("y1", "10");
      line1.setAttribute("x2", "90");
      line1.setAttribute("y2", "90");

      const line2 = document.createElementNS(svgNS, "line");
      line2.setAttribute("x1", "90");
      line2.setAttribute("y1", "10");
      line2.setAttribute("x2", "10");
      line2.setAttribute("y2", "90");

      return [line1, line2];
    },
  },
  o: {
    color: "blue",
    buildSVGShapes: (svgNS) => {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", "50");
      circle.setAttribute("cy", "50");
      circle.setAttribute("r", "48");
      circle.setAttribute("fill", "none");

      return [circle];
    },
  },
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
  }

  function playRound(index) {
    // The UI blocks illegal moves; this is just a nice‑to‑have fallback.
    const moveIllegal = !validateMove(index);
    if (moveIllegal) return;

    const marker = currentPlayer.getMarker();
    Gameboard.setCell(index, marker);

    checkWinner();
    if (winner === undefined) {
      switchPlayer();
    } else {
      gameOver = true;
    }

    function validateMove(index) {
      const board = Gameboard.getBoard();
      const illegalMoves = {
        gameOver,
        cellOccupied: board[index] !== null,
      };
      const isIllegal = Object.values(illegalMoves).some(Boolean);
      return !isIllegal;
    }

    function checkWinner() {
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

      const board = Gameboard.getBoard();
      const currentMarker = currentPlayer.getMarker();
      for (const pattern of WIN_PATTERNS) {
        const matchesMarker = pattern.every(
          (index) => board[index] === currentMarker
        );
        if (matchesMarker) {
          winner = {
            player: currentPlayer,
            marker: currentMarker,
            pattern: pattern,
          };
          return;
        }
      }

      const boardFull = board.every((marker) => marker !== null);
      if (boardFull) {
        winner = null;
        return;
      }
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

  function init() {
    buildGameboard();

    gameboardContainer.addEventListener("click", handleMove);
    resetButton.addEventListener("click", handleReset);

    render();

    function buildCell(index) {
      const node = document.createElement("button");
      node.className = "cell";
      node.dataset.index = index;
      return node;
    }

    function buildGameboard() {
      const board = Gameboard.getBoard();
      const cellButtons = board.map((_, index) => buildCell(index));
      gameboardContainer.append(...cellButtons);
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
      dialog.close();

      GameController.init();
      render();
    }
  }

  function render() {
    const status = GameController.getStatus();

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

        const markerSVG = buildMarkerSVG(marker || currentMarker, isEmpty);
        const isWinning = winner?.pattern.includes(index);
        markerSVG.classList.toggle("dimmed", gameOver && !isWinning);
        node.replaceChildren(markerSVG);
      });
    }

    function buildMarkerSVG(marker, preview = false) {
      const svgNS = "http://www.w3.org/2000/svg";
      const node = document.createElementNS(svgNS, "svg");
      node.setAttribute("class", "glyph");
      node.classList.toggle("preview", preview);

      node.setAttribute("viewBox", "0 0 100 100");
      node.setAttribute("stroke-width", "2");
      node.setAttribute("stroke", marker.color);
      node.setAttribute("stroke-linecap", "round");

      const shapes = marker.buildSVGShapes(svgNS);
      node.append(...shapes);

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

GameController.init();
DisplayController.init();
