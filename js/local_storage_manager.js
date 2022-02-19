window.fakeStorage = {
  _data: {},

  setItem: function (id, val) {
    return this._data[id] = String(val);
  },

  getItem: function (id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem: function (id) {
    return delete this._data[id];
  },

  clear: function () {
    return this._data = {};
  }
};

function LocalStorageManager() {
  this.bestScoreKey     = "bestScore";
  this.gameStateKey     = "gameState";

  var supported = this.localStorageSupported();
  this.storage = supported ? window.localStorage : window.fakeStorage;
}

LocalStorageManager.prototype.localStorageSupported = function () {
  var testKey = "test";

  try {
    var storage = window.localStorage;
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

// Best score getters/setters
LocalStorageManager.prototype.getBestScore = function () {
  return this.storage.getItem(this.bestScoreKey) || 0;
};

LocalStorageManager.prototype.setBestScore = function (score) {
  this.storage.setItem(this.bestScoreKey, score);
};

// Game state getters/setters and clearing
LocalStorageManager.prototype.getGameState = function () {
  return decodeGameStateHash();
};

LocalStorageManager.prototype.setGameState = function (gameState) {
  history.replaceState(null, "", `index.html#${encodeGameState(gameState)}`)
};

LocalStorageManager.prototype.clearGameState = function () {
  history.pushState(null, "", `index.html`)
};

function decodeGameStateHash() {
  const hash = window.location.hash.slice(1); // Remove # character.
  if (!hash) {
    return null;
  }

  const segments = decodeURIComponent(hash).split(".");

  const gameState = {
    score: parseInt(segments[0]),
    over: segments[1] === '1',
    won: segments[2] === '1',
    keepPlaying: segments[3] === '1',
    grid: {
      size: parseInt(segments[4]),
      cells: [],
    },
  }

  let segmentIndex = 5;
  for (let i = 0; i < gameState.grid.size; i++) {
    const row = [];
    for (let j = 0; j < gameState.grid.size; j++) {
      const value = segments[segmentIndex];
      if (value === "0") {
        row.push(null);
      } else {
        row.push({
          position: {x: i, y: j},
          value: Math.pow(2, parseInt(value, 16)),
        });
      }
      segmentIndex++;
    }
    gameState.grid.cells.push(row);
  }

  return gameState;
}

// score":512,"over":false,"won":false,"keepPlaying":false
function encodeGameState(gameState) {
  const segments = [
    `${gameState.score}`,
    `${gameState.over ? 1 : 0}`,
    `${gameState.won ? 1 : 0}`,
    `${gameState.keepPlaying ? 1 : 0}`,
    `${gameState.grid.size}`,
  ];

  for (let i = 0; i < gameState.grid.size; i++) {
    const row = gameState.grid.cells[i];
    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      if (cell) {
        segments.push((Math.log(cell.value) / Math.log(2)).toString(16));
      } else {
        segments.push("0");
      }
    }
  }

  const hash = segments.join('.');
  return encodeURIComponent(hash);
}