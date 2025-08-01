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
      line1.setAttribute("class", "line1");
      line1.setAttribute("vector-effect", "non-scaling-stroke");

      const line2 = document.createElementNS(svgNS, "line");
      line2.setAttribute("x1", "90");
      line2.setAttribute("y1", "10");
      line2.setAttribute("x2", "10");
      line2.setAttribute("y2", "90");
      line2.setAttribute("class", "line2");
      line2.setAttribute("vector-effect", "non-scaling-stroke");

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
      circle.setAttribute("vector-effect", "non-scaling-stroke");

      return [circle];
    },
  },
};

function createPlayer(name, markerId, AI = false) {
  const marker = { ...MARKERS[markerId], id: markerId };
  let isThinking = false;

  return {
    getName: () => name,
    getMarker: () => marker,
    isAI: () => AI,
    isThinking: () => isThinking,
    setThinking: (arg) => (isThinking = arg),
  };
}

const GameController = (function () {
  let players;
  let currentPlayer;
  let gameOver;
  let winner;

  function init() {
    Gameboard.init();
    players = [createPlayer("Human", "x"), createPlayer("Computer", "o", true)];

    currentPlayer = players[0];
    gameOver = false;
    winner = undefined;
  }

  function playRound(index) {
    const marker = currentPlayer.getMarker();
    Gameboard.setCell(index, marker);

    checkWinner();
    if (winner === undefined) {
      switchPlayer();

      if (currentPlayer.isAI()) {
        handleAIMove();
      }
    } else {
      gameOver = true;
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

    function handleAIMove() {
      currentPlayer.setThinking(true);

      const delay = 1000;
      setTimeout(() => {
        const AIMove = getRandomMove();
        playRound(AIMove);
        currentPlayer.setThinking(false);
        DisplayController.render();
      }, delay);

      function getRandomMove() {
        const board = Gameboard.getBoard();
        const emptyCellIndices = board.reduce((acc, marker, index) => {
          if (marker === null) acc.push(index);
          return acc;
        }, []);
        const randomEmptyCellIndex = Math.floor(
          Math.random() * emptyCellIndices.length
        );
        return emptyCellIndices[randomEmptyCellIndex];
      }
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

  const statusContainer = document.querySelector("#status");
  const messageParagraph = statusContainer.querySelector("#message");

  const controlsContainer = document.querySelector("#controls");
  const resetButton = controlsContainer.querySelector("#reset-button");

  function init() {
    buildGameboard();

    render();

    function buildGameboard() {
      const board = Gameboard.getBoard();
      const cellButtons = board.map((_, index) => buildCell(index));
      gameboardContainer.append(...cellButtons);
      gameboardContainer.style.visibility = "visible";

      gameboardContainer.addEventListener("click", handleHumanMove);

      function buildCell(index) {
        const node = document.createElement("button");
        node.className = "cell";
        node.dataset.index = index;
        return node;
      }

      function handleHumanMove({ target }) {
        const cellNode = target.closest(".cell");
        if (cellNode) {
          const index = Number(cellNode.dataset.index);
          GameController.playRound(index);
          render();
        }
      }
    }
  }

  function render() {
    const status = GameController.getStatus();

    renderGameboard(status);
    renderGameOver(status);

    function renderGameboard({ board, currentPlayer, gameOver, winner }) {
      const cellButtons = gameboardContainer.querySelectorAll(".cell");
      const currentMarker = currentPlayer.getMarker();

      cellButtons.forEach((node, index) => {
        renderCell(node, index);
      });

      function renderCell(node) {
        const index = Number(node.dataset.index);
        const marker = board[index];

        const glyph = node.querySelector(".glyph");
        const glyphVisible = glyph && !glyph.classList.contains("preview");
        const currentMove = marker && !glyphVisible;

        const illegalMoves = {
          cellOccupied: board[index] !== null,
          opponentThinking: currentPlayer.isThinking(),
          gameOver: gameOver,
        };

        const moveLegal = Object.values(illegalMoves).every((check) => !check);
        node.toggleAttribute("disabled", !moveLegal);
        node.classList.toggle("loading", illegalMoves.opponentThinking);

        const markerSVG = buildMarkerSVG(marker || currentMarker);
        node.replaceChildren(markerSVG);

        if (currentMove) {
          const shapes = Array.from(markerSVG.children);
          for (const shape of shapes) {
            const length = shape.getTotalLength();
            shape.style.strokeDasharray = length;
            shape.style.strokeDashoffset = length;
          }

          markerSVG.classList.add("animate");
        }

        function buildMarkerSVG(marker) {
          const svgNS = "http://www.w3.org/2000/svg";
          const node = document.createElementNS(svgNS, "svg");
          node.setAttribute("class", "glyph");

          node.classList.toggle("preview", !illegalMoves.cellOccupied);

          const isWinning = winner?.pattern.includes(index);
          node.classList.toggle("dimmed", illegalMoves.gameOver && !isWinning);

          node.setAttribute("viewBox", "0 0 100 100");
          node.setAttribute("stroke-width", "2");
          node.setAttribute("stroke", marker.color);
          node.setAttribute("stroke-linecap", "round");

          const shapes = marker.buildSVGShapes(svgNS);
          node.append(...shapes);

          return node;
        }
      }
    }

    function renderGameOver(status) {
      renderStatus(status);
      renderControls(status.gameOver);

      function renderStatus(status) {
        if (!status.gameOver) {
          statusContainer.style.visibility = "hidden";
          return;
        }

        renderMessage(status.winner);

        statusContainer.style.visibility = "visible";

        function buildPlayerNameSpan({ player, marker }) {
          const node = document.createElement("span");
          node.className = "player-name";
          node.dataset.marker = marker.id;
          node.textContent = player.getName();
          node.style.color = marker.color;
          return node;
        }

        function renderMessage(winner) {
          if (winner) {
            const playerNameSpan = buildPlayerNameSpan(winner);
            messageParagraph.replaceChildren(playerNameSpan, " wins!");
          } else {
            messageParagraph.replaceChildren("Tie.");
          }
        }
      }

      function renderControls(gameOver) {
        if (!gameOver) {
          controlsContainer.style.visibility = "hidden";
          return;
        }

        renderResetButton();

        controlsContainer.style.visibility = "visible";

        function renderResetButton() {
          resetButton.addEventListener("click", handleReset, { once: true });
        }

        function handleReset() {
          GameController.init();
          render();
        }
      }
    }
  }

  return { init, render };
})();

GameController.init();
DisplayController.init();
